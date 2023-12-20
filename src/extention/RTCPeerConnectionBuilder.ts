import { HubConnection, HubConnectionBuilder, HubConnectionState, LogLevel } from '@microsoft/signalr';
import mqtt from 'mqtt/dist/mqtt';
import { environment } from 'src/environments/environment';

enum SignalingTopic {
    AnswerSDP = 'AnswerSDP',
    AnswerICE = 'AnswerICE',
    OfferSDP = 'OfferSDP',
    OfferICE = 'OfferICE',
    JoinAsServer = 'JoinAsServer',
    JoinAsClient = 'JoinAsClient'
}

enum Codecs {
    H264 = 'H264',
    VP8 = 'VP8',
    VP9 = 'VP9',
    AV1 = 'AV1'
}

enum CommandType {
    CONNECT,
    RECORD,
    STREAM,
    UNKNOWN
};

class Command {
    type: CommandType;
    message: string;
    constructor(type: CommandType, message: string) {
        this.type = type;
        this.message = message;
    }
}

interface SignalingService {
    start(): void;
    publish(topic: SignalingTopic, ...args: any): any;
    subscribe(topic: SignalingTopic, callback: (...args: any[]) => any): void;
    end(): void;
}

class SignalrClient implements SignalingService {
    private url: string;
    private connection: HubConnection;

    constructor(url: string) {
        this.url = url;
    }

    async start() {
        this.connection = new HubConnectionBuilder()
            .withUrl(this.url)
            .configureLogging(LogLevel.Information)
            .withAutomaticReconnect()
            .build();
        await this.connection.start();
        console.assert(this.connection.state === HubConnectionState.Connected);
        console.log("SignalR Connected.");
    }

    publish(topic: SignalingTopic, ...args: any[]): any {
        this.connection.invoke(topic, ...args).catch(
            error => console.error(error.toString())
        );
    }

    subscribe(topic: SignalingTopic, callback: (...args: any[]) => any): void {
        this.connection.on(topic, callback);
    }

    end(): void {
        this.connection.stop();
    }
}

class MqttClient implements SignalingService {
    private options: mqtt.IClientOptions;
    private connection: mqtt.MqttClient;
    private subscribedFnMap: Map<SignalingTopic, (...args: any[]) => any>;

    constructor(options: mqtt.IClientOptions) {
        this.options = options;
        this.subscribedFnMap = new Map<SignalingTopic, (...args: any[]) => any>();
    }

    start(): void {
        this.connection = mqtt.connect(this.options);
        this.connection.on('message', (topic, message) => {
            this.subscribedFnMap.get(topic)(JSON.parse(message.toString()));
        });
    }

    publish(topic: SignalingTopic, msg: any): any {
        if (msg) {
            this.connection.publish(topic, JSON.stringify(msg));
        }
    }

    subscribe(topic: SignalingTopic, callback: (...args: any[]) => any): void {
        this.connection.subscribe(topic);
        this.subscribedFnMap.set(topic, callback);
    }

    end(): void {
        this.connection.end();
    }
}

interface SignalingConnection {
    setType(type: "offer" | "answer"): SignalingConnection;

    connectServerPeer(): void;
    listenOfferTopics(): void;
    listenAnswerTopics(): void;
    offerLocalIceToRemote(candidate: RTCIceCandidate): void;
    offerDescription(
        description: RTCSessionDescriptionInit,
        connection: signalR.HubConnection,
    ): void;
    answerLocalIceToRemote(candidate: RTCIceCandidate): void;
    answerDescription(
        description: RTCSessionDescriptionInit,
        connection: signalR.HubConnection,
    ): void;
}

class RTCPeerConnectionBuilder implements SignalingConnection {
    private type: 'offer' | 'answer';
    private connectionId: string;
    connection: SignalingService;
    private codec: Codecs;
    private dstElement: HTMLVideoElement;
    peer: RTCPeerConnection;
    private dataChannel: RTCDataChannel;
    private onConnected: ((ev: Event) => any) | null;
    private onDisconnectedOrFailed: ((ev: Event) => any) | null;

    constructor(connection: SignalingService) {
        this.connection = connection;
    }

    createPeer() {
        this.peer = new RTCPeerConnection(environment.peerConnectionConfig);

        this.dataChannel = this.peer.createDataChannel("cmd_channel", { negotiated: true, ordered: true, id: 0 });
        this.dataChannel.onmessage = (ev) => {
            console.log(new TextDecoder('utf-8').decode(ev.data));
        };

        this.peer.onicecandidate = ev => {
            if (this.type == 'answer') {
                console.info('answerLocalIceToRemote', ev.candidate);
                this.answerLocalIceToRemote(ev.candidate);
            } else if (this.type == 'offer') {
                console.info('offerLocalIceToRemote', ev.candidate);
                this.offerLocalIceToRemote(ev.candidate);
            }
        };

        this.peer.ondatachannel = (e: RTCDataChannelEvent) => {
            console.log('conneceted channel: ' + e.channel.label);
            // e.channel.onmessage = (ev) => this.onReceiveMessage(ev);
            // this.dataChannels.push(e.channel);
        };

        let mediaStream = new MediaStream();
        this.dstElement.srcObject = mediaStream;
        this.peer.ontrack = (ev) => {
            mediaStream.addTrack(ev.track);
            console.log('received remote stream', ev);
        };

        this.peer.onconnectionstatechange = (ev) => {
            switch (this.peer.connectionState) {
                case "new":
                case "connecting":
                    break;
                case "connected":
                    this.onConnected(ev);
                    break;
                case "disconnected":
                    this.onDisconnectedOrFailed(ev);
                    break;
                case "closed":
                    break;
                case "failed":
                    this.onDisconnectedOrFailed(ev);
                    break;
                default:
                    break;
            }
        }

        this.peer.addTransceiver('video', { direction: 'recvonly' });
        this.peer.addTransceiver('audio', { direction: 'recvonly' });

        return this.peer;
    }

    setDstElement(element: HTMLVideoElement) {
        this.dstElement = element;
        return this;
    }

    setCodec(codec: Codecs) {
        this.codec = codec;
        return this;
    }

    setOnConnected(callback: (ev: Event) => any) {
        this.onConnected = callback;
        return this;
    }

    setOnDisconnectedOrFailed(callback: (ev: Event) => any) {
        this.onDisconnectedOrFailed = callback;
        return this;
    }

    answerDescription(description: RTCSessionDescriptionInit) {
        this.peer.setLocalDescription(description);
        console.log(SignalingTopic.AnswerSDP, description);
        this.connection.publish(SignalingTopic.AnswerSDP, this.connectionId, description);
    }

    answerLocalIceToRemote(candidate: RTCIceCandidate) {
        if (candidate) {
            this.connection.publish(SignalingTopic.AnswerICE, this.connectionId, candidate);
        }
    }

    offerDescription(description: RTCSessionDescriptionInit) {
        this.peer.setLocalDescription(description);
        console.log(SignalingTopic.OfferSDP, description);
        this.connection.publish(SignalingTopic.OfferSDP, description);
    }

    offerLocalIceToRemote(candidate: RTCIceCandidate) {
        if (candidate) {
            this.connection.publish(SignalingTopic.OfferICE, candidate);
        }
    }

    listenAnswerTopics() {
        this.connection.subscribe(SignalingTopic.AnswerSDP, (recvDesc: RTCSessionDescriptionInit) => {
            console.log("setRemoteDescription: ", recvDesc);
            this.peer.setRemoteDescription(recvDesc);
        });

        this.connection.subscribe(SignalingTopic.AnswerICE, (recvCandidate: RTCIceCandidate) => {
            this.peer.addIceCandidate(recvCandidate).then(() => {
                console.log("Add remote ICE candidate: ", recvCandidate);
            }, error => {
                console.log(`Failed to add Ice Candidate: ${error.toString()}`);
            });
        });
    }

    listenOfferTopics() {
        this.connection.subscribe(SignalingTopic.OfferSDP, (recvDesc: RTCSessionDescriptionInit) => {
            this.peer.setRemoteDescription(recvDesc);
            this.peer.createAnswer().then(
                desc => {
                    this.answerDescription(desc);
                }
            );
        });

        this.connection.subscribe(SignalingTopic.OfferICE, (recvCandidate: RTCIceCandidate) => {
            this.peer.addIceCandidate(recvCandidate).then(() => {
                console.log("Add remote ICE candidate: ", recvCandidate);
            }, error => {
                console.log(`Failed to add Ice Candidate: ${error.toString()}`);
            });
        });
    };

    setType(type: 'offer' | 'answer' = 'offer') {
        this.type = type;

        if (type == 'answer') {
            this.listenOfferTopics();
        } else if (type == 'offer') {
            this.listenAnswerTopics();
        }

        return this;
    };

    connectServerPeer() {
        this.peer.createOffer().then(
            desc => {
                if (!this.codec) {
                    this.codec = Codecs.H264;
                }
                for (let item in Codecs) {
                    if (item !== this.codec) {
                        desc.sdp = this.removeCodec(desc.sdp, item);
                    }
                }
                this.offerDescription(desc);
            }
        );
    };

    removeCodec(orgsdp, codec) {
        const internalFunc = (sdp) => {
            const codecre = new RegExp('(a=rtpmap:(\\d*) ' + codec + '\/90000\\r\\n)');
            const rtpmaps = sdp.match(codecre);
            if (rtpmaps == null || rtpmaps.length <= 2) {
                return sdp;
            }
            const rtpmap = rtpmaps[2];
            let modsdp = sdp.replace(codecre, "");

            const rtcpre = new RegExp('(a=rtcp-fb:' + rtpmap + '.*\r\n)', 'g');
            modsdp = modsdp.replace(rtcpre, "");

            const fmtpre = new RegExp('(a=fmtp:' + rtpmap + '.*\r\n)', 'g');
            modsdp = modsdp.replace(fmtpre, "");

            const aptpre = new RegExp('(a=fmtp:(\\d*) apt=' + rtpmap + '\\r\\n)');
            const aptmaps = modsdp.match(aptpre);
            let fmtpmap = "";
            if (aptmaps != null && aptmaps.length >= 3) {
                fmtpmap = aptmaps[2];
                modsdp = modsdp.replace(aptpre, "");

                const rtppre = new RegExp('(a=rtpmap:' + fmtpmap + '.*\r\n)', 'g');
                modsdp = modsdp.replace(rtppre, "");
            }

            let videore = /(m=video.*\r\n)/;
            const videolines = modsdp.match(videore);
            if (videolines != null) {
                //If many m=video are found in SDP, this program doesn't work.
                let videoline = videolines[0].substring(0, videolines[0].length - 2);
                const videoelems = videoline.split(" ");
                let modvideoline = videoelems[0];
                videoelems.forEach((videoelem, index) => {
                    if (index === 0) return;
                    if (videoelem == rtpmap || videoelem == fmtpmap) {
                        return;
                    }
                    modvideoline += " " + videoelem;
                })
                modvideoline += "\r\n";
                modsdp = modsdp.replace(videore, modvideoline);
            }
            return internalFunc(modsdp);
        }
        return internalFunc(orgsdp);
    }

    build(): [RTCPeerConnection, RTCDataChannel] {

        if (this.type == 'answer') {
            this.connection.publish(SignalingTopic.JoinAsServer);
        } else if (this.type == 'offer') {
            this.connection.publish(SignalingTopic.JoinAsClient);
        }

        this.createPeer();
        this.connectServerPeer();

        return [this.peer, this.dataChannel];
    }
}

export {
    Codecs, SignalingService, SignalrClient, MqttClient,
    RTCPeerConnectionBuilder, CommandType, Command
};
