// ng build --prod  or add argument --environment=prod
// ng serve --prod
export const environment = {
  production: true,
  authUrl: `https://rich-greenhouse.ddns.net/api`,
  greenhouseUrl: `https://rich-greenhouse.ddns.net/api`,
  sensorHubUrl: `https://rich-greenhouse.ddns.net/SensorHub`,
  signalingUrl: `https://rich-greenhouse.ddns.net/SignalingServer`,
  raspGpioUrl: `https://rich-greenhouse.ddns.net/gpio`,
  raspPwmUrl: `https://rich-greenhouse.ddns.net/pwm`,
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
