enum SignalingTopic {
    AnswerSDP = 'AnswerSDP',
    AnswerICE = 'AnswerICE',
    OfferSDP = 'OfferSDP',
    OfferICE = 'OfferICE',
    SIGHTED_PROOF_OF_AGE_CARD = 'sighted_proof_of_age_card'
}

interface RTCPeerConnection {
    type: "offer" | "answer";
    connectionId: string;
    signalingServer: signalR.HubConnection;

    listenTopics(type: "offer" | "answer"): RTCPeerConnection;
    build(): RTCPeerConnection;
    setSignalingUrl(signalingServer: signalR.HubConnection): RTCPeerConnection;
    
    connectServerPeer(): void;
    listenOfferTopics(): void;
    listenAnswerTopics(): void;
    offerLocalIceToRemote(candidate: RTCIceCandidate): void;
    offerDescription(
        description: RTCSessionDescriptionInit,
        signalingServer: signalR.HubConnection,
    ): void;
    answerLocalIceToRemote(candidate: RTCIceCandidate): void;
    answerDescription(
        description: RTCSessionDescriptionInit,
        signalingServer: signalR.HubConnection,
    ): void;
}

RTCPeerConnection.prototype.setSignalingUrl = function (
    signalingServer: signalR.HubConnection,
) {
    this.signalingServer = signalingServer;
    return this;
};

RTCPeerConnection.prototype.answerDescription = function (
    description: RTCSessionDescriptionInit,
) {
    this.setLocalDescription(description);
    console.log(SignalingTopic.AnswerSDP, description);
    this.signalingServer.invoke(SignalingTopic.AnswerSDP, this.connectionId, description).catch(
        error => console.error(error.toString())
    );
};

RTCPeerConnection.prototype.answerLocalIceToRemote = function (
    candidate: RTCIceCandidate,
) {
    if (candidate) {
        this.signalingServer.invoke(SignalingTopic.AnswerICE, this.connectionId, candidate).catch(
            error => console.error(error.toString())
        );
    }
};

RTCPeerConnection.prototype.offerDescription = function (
    description: RTCSessionDescriptionInit,
) {
    this.setLocalDescription(description);
    console.log(SignalingTopic.OfferSDP, description);
    this.signalingServer.invoke(SignalingTopic.OfferSDP, description).catch(
        error => console.error(error.toString())
    );
};

RTCPeerConnection.prototype.offerLocalIceToRemote = function (
    candidate: RTCIceCandidate,
) {
    if (candidate) {
        this.signalingServer.invoke(SignalingTopic.OfferICE, candidate).catch(
            error => console.error(error.toString())
        );
    }
};

RTCPeerConnection.prototype.listenAnswerTopics = function () {
    this.signalingServer.on(SignalingTopic.AnswerSDP, (recvDesc: RTCSessionDescriptionInit) => {
        console.log("setRemoteDescription: ", recvDesc);
        this.setRemoteDescription(recvDesc);
    });

    this.signalingServer.on(SignalingTopic.AnswerICE, (recvCandidate: RTCIceCandidate) => {
        this.addIceCandidate(recvCandidate).then(() => {
        }, error => {
            console.log(`Failed to add Ice Candidate: ${error.toString()}`);
        });
    });

};

RTCPeerConnection.prototype.listenOfferTopics = function () {
    this.signalingServer.on('OfferSDP', (recvDesc: RTCSessionDescriptionInit) => {
        this.setRemoteDescription(recvDesc);
        this.createAnswer().then(
            desc => {
                desc.sdp = removeCodec(desc.sdp, 'H264');
                desc.sdp = removeCodec(desc.sdp, 'VP9');
                desc.sdp = removeCodec(desc.sdp, 'AV1');
                this.answerDescription(desc);
            }
        );
    });

    this.signalingServer.on('OfferICE', (recvCandidate: RTCIceCandidate) => {
        this.addIceCandidate(recvCandidate).then(() => {
        }, error => {
            console.log(`Failed to add Ice Candidate: ${error.toString()}`);
        });
    });
};

RTCPeerConnection.prototype.listenTopics = function (type: "offer" | "answer") {
    this.type = type;

    if (type == 'answer') {
        this.listenOfferTopics();
    } else if (type == 'offer') {
        this.listenAnswerTopics();
    }

    return this;
};

RTCPeerConnection.prototype.connectServerPeer = function () {
    this.createOffer().then(
        desc => {
            // desc.sdp = removeCodec(desc.sdp, 'H264');
            // desc.sdp = removeCodec(desc.sdp, 'VP8');
            desc.sdp = removeCodec(desc.sdp, 'VP9');
            desc.sdp = removeCodec(desc.sdp, 'AV1');
            this.offerDescription(desc);
        }
    );
};

RTCPeerConnection.prototype.build = function () {
    if (this.type == 'answer') {
        if (this.signalingServer.state !== 'Connected') {
            this.signalingServer.start().then(() => {
                this.signalingServer.invoke('JoinAsServer');
            }).catch(error => console.error(error));
        } else {
            this.signalingServer.invoke('JoinAsServer');
        }
    } else if (this.type == 'offer') {
        if (this.signalingServer.state !== 'Connected') {
            this.signalingServer.start().then(() => {
                this.signalingServer.invoke('JoinAsClient');
                this.connectServerPeer();
            }).catch(error => console.error(error));
        } else {
            this.signalingServer.invoke('JoinAsClient');
            this.connectServerPeer();
        }
    }

    return this;
}

function removeCodec(orgsdp, codec) {
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