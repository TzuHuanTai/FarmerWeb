interface RTCPeerConnection {
    type: string;
    cameraId: string;
    connectionId: string;
    signalingServer: signalR.HubConnection;
    build(): RTCPeerConnection;
    setCamera(cameraId: string): RTCPeerConnection;
    withStartOffer(): RTCPeerConnection;
    withListeningOffer(): RTCPeerConnection;
    setSignalingServer(signalingServer: signalR.HubConnection): RTCPeerConnection;
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

RTCPeerConnection.prototype.setSignalingServer = function (
    signalingServer: signalR.HubConnection,
) {
    this.signalingServer = signalingServer;
    return this;
};

RTCPeerConnection.prototype.setCamera = function (
    cameraId: string,
) {
    this.cameraId = cameraId;
    return this;
};

RTCPeerConnection.prototype.answerDescription = function (
    description: RTCSessionDescriptionInit,
) {
    this.setLocalDescription(description);
    console.log('AnswerSDP', description);
    this.signalingServer.invoke('AnswerSDP', description).catch(
        error => console.error(error.toString())
    );
};

RTCPeerConnection.prototype.answerLocalIceToRemote = function (
    candidate: RTCIceCandidate,
) {
    if (candidate) {
        this.signalingServer.invoke('AnswerICE', candidate).catch(
            error => console.error(error.toString())
        );
    }
};

RTCPeerConnection.prototype.offerDescription = function (
    description: RTCSessionDescriptionInit,
) {
    this.setLocalDescription(description);
    console.log('OfferSDP', description);
    this.signalingServer.invoke('OfferSDP', this.connectionId, description).catch(
        error => console.error(error.toString())
    );
};

RTCPeerConnection.prototype.offerLocalIceToRemote = function (
    candidate: RTCIceCandidate,
) {
    if (candidate) {
        this.signalingServer.invoke('OfferICE', this.connectionId, candidate).catch(
            error => console.error(error.toString())
        );
    }
};

RTCPeerConnection.prototype.withStartOffer = function () {
    this.type = 'offer';

    this.signalingServer.on('AnswerSDP', (recvDesc: RTCSessionDescriptionInit) => {
        console.log("setRemoteDescription: ", recvDesc);
        this.setRemoteDescription(recvDesc);
    });

    this.signalingServer.on('AnswerICE', (recvCandidate: RTCIceCandidate) => {
        this.addIceCandidate(recvCandidate).then(() => {
        }, error => {
            console.log(`Failed to add Ice Candidate: ${error.toString()}`);
        });
    });

    this.signalingServer.on('ClientConnected', (connectionId: string, cameraId: string) => {
        console.log(`Signaling ClientConnected: receive ${connectionId} is connected to signaling server!`);
        this.connectionId = connectionId;

        this.createOffer().then(
            desc => {
                desc.sdp = removeCodec(desc.sdp, 'H264');
                desc.sdp = removeCodec(desc.sdp, 'VP9');
                desc.sdp = removeCodec(desc.sdp, 'AV1');
                this.offerDescription(desc);
            }
        );
    });

    return this;
};

RTCPeerConnection.prototype.withListeningOffer = function () {
    this.type = 'answer';

    this.signalingServer.on('OfferSDP', (recvDesc: RTCSessionDescriptionInit) => {
        this.setRemoteDescription(recvDesc);
        this.createAnswer().then(
            desc => {
                // desc.sdp = removeCodec(desc.sdp, 'H264');
                // desc.sdp = removeCodec(desc.sdp, 'VP9');
                // desc.sdp = removeCodec(desc.sdp, 'AV1');
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

    return this;
};

RTCPeerConnection.prototype.build = function () {
    if (this.type == 'answer') {
        if (this.signalingServer.state !== 'Connected') {
            this.signalingServer.start().then(() => {
                this.signalingServer.invoke('ClientJoin', 'client', this.cameraId);
            }).catch(error => console.error(error));
        } else {
            this.signalingServer.invoke('ClientJoin', 'client', this.cameraId);
        }
    } else if (this.type == 'offer') {
        if (this.signalingServer.state !== 'Connected') {
            this.signalingServer.start().then(() => {
                this.signalingServer.invoke('ServerJoin', 'Server');
            }).catch(error => console.error(error));
        } else {
            this.signalingServer.invoke('ServerJoin', 'Server');
        }
    }

    return this;
};

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