import { IClientOptions } from 'mqtt';

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

export const mqClientOptions: IClientOptions = {
  hostname: 'greenhouse',
  port: 8083,
  username: 'hakunamatata',
  password: 'wonderful',
  protocol: 'ws',
  path: '/mqtt'
};
