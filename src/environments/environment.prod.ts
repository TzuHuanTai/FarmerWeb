// ng build --prod  or add argument --environment=prod
// ng serve --prod
export const environment = {
  production: true,
  authUrl: location.protocol === 'http:' ? `http://rich-greenhouse.ddns.net:5080/api` : `https://rich-greenhouse.ddns.net:5443/api`,
  greenhouseUrl: location.protocol === 'http:' ? `http://rich-greenhouse.ddns.net:6080/api` : `https://rich-greenhouse.ddns.net:6443/api`,
  sensorHubUrl: location.protocol === 'http:' ? `http://rich-greenhouse.ddns.net:6080/SensorHub` : `https://rich-greenhouse.ddns.net:6443/SensorHub`,
  signalingUrl: location.protocol === 'http:' ? `http://rich-greenhouse.ddns.net:6080/SignalingServer` : `https://rich-greenhouse.ddns.net:6443/SignalingServer`,
  raspGpioUrl: location.protocol === 'http:' ? `http://rich-greenhouse.ddns.net:3080/gpio` : `https://rich-greenhouse.ddns.net:3443/gpio`,
  raspPwmUrl: location.protocol === 'http:' ? `http://rich-greenhouse.ddns.net:3080/pwm` : `https://rich-greenhouse.ddns.net:3443/pwm`,
  appId: 0,
  peerConnectionConfig: {
    'iceServers': [{
      'urls': 'stun:stun.l.google.com:19302'
    }, {
      'urls': 'turn:rich-greenhouse.ddns.net:3478?transport=tcp',
      'username': 'webrtc',
      'credential': 'webrtc'
    }]
  },
};
