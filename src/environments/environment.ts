// The file contents for the current environment will overwrite these during build.
// The build system defaults to the dev environment which uses `environment.ts`, but if you do
// `ng build --env=prod` then `environment.prod.ts` will be used instead.
// The list of which env maps to which file can be found in `.angular-cli.json`.

// "ng build" or "ng serve" only
export const environment = {
  production: false,
  authUrl: `https://greenhouse/api`,
  greenhouseUrl: `https://greenhouse/api`,
  sensorHubUrl: `https://greenhouse/SensorHub`,
  signalingUrl: `https://greenhouse/SignalingServer`,
  raspGpioUrl: `https://greenhouse/gpio`,
  raspPwmUrl: `https://greenhouse/pwm`,
  appId: 0,
  peerConnectionConfig: {
    'iceServers': [{
      'urls': 'stun:stun.l.google.com:19302'
    }, {
      'urls': 'turn:greenhouse:3478?transport=tcp',
      'username': 'webrtc',
      'credential': 'webrtc'
    }]
  },
};