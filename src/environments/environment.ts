// The file contents for the current environment will overwrite these during build.
// The build system defaults to the dev environment which uses `environment.ts`, but if you do
// `ng build --env=prod` then `environment.prod.ts` will be used instead.
// The list of which env maps to which file can be found in `.angular-cli.json`.

// "ng build" or "ng serve" only
export const environment = {
  production: false,
  authUrl: location.protocol === 'http:' ? `http://174.127.170.158:5080/api` : `https://greenhouse:5443/api`,
  greenhouseUrl: location.protocol === 'http:' ? `http://174.127.170.158:6080/api` : `https://greenhouse:6443/api`,
  sensorHubUrl: location.protocol === 'http:' ? `http://174.127.170.158:6080/SensorHub` : `https://greenhouse:6443/SensorHub`,
  signalingUrl: location.protocol === 'http:' ? `http://174.127.170.158:6080/SignalingServer` : `https://greenhouse:6443/SignalingServer`,
  raspGpioUrl: `http://174.127.170.158:3080/gpio`,
  raspPwmUrl: `http://174.127.170.158:3080/pwm`,
  appId: 0,
  peerConnectionConfig: {
    'iceServers': [{
      'urls': 'stun:stun.l.google.com:19302'
    }, {
      'urls': 'turn:174.127.170.158:3478?transport=tcp',
      'username': 'webrtc',
      'credential': 'webrtc'
    }]
  },
};