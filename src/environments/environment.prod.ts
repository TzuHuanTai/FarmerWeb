import { IClientOptions } from "mqtt";

export const environment = {
  production: true,
  authUrl: `https://${location.hostname}/api`,
  greenhouseUrl: `https://${location.hostname}/api`,
  sensorHubUrl: `https://${location.hostname}/SensorHub`,
  signalingUrl: `https://${location.hostname}/SignalingServer`,
  raspGpioUrl: `https://${location.hostname}/gpio`,
  raspPwmUrl: `https://${location.hostname}/pwm`,
  appId: 0,
  peerConnectionConfig: {
    'iceServers': [{
      'urls': 'stun:stun.l.google.com:19302'
    }, {
      'urls': `turn:${location.hostname}:3478?transport=tcp`,
      'username': 'webrtc',
      'credential': 'webrtc'
    }]
  },
};

export const mqClientOptions: IClientOptions = {
  hostname: `${location.hostname}`,
  port: 8083,
  username: 'hakunamatata',
  password: 'wonderful',
  protocol: 'wss',
  path: '/mqtt'
};
