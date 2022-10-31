// ng build --prod  or add argument --environment=prod
// ng serve --prod
export const environment = {
  production: true,
  authUrl: location.protocol === 'http:' ? `http://${window.location.hostname}:5080/api` : `https://${window.location.hostname}:5443/api`,
  greenhouseUrl: location.protocol === 'http:' ? `http://${window.location.hostname}:6080/api` : `https://${window.location.hostname}:6443/api`,
  sensorHubUrl: location.protocol === 'http:' ? `http://${window.location.hostname}:6080/SensorHub` : `https://${window.location.hostname}:6443/SensorHub`,
  signalingUrl: location.protocol === 'http:' ? `http://${window.location.hostname}:6080/SignalingServer` : `https://${window.location.hostname}:6443/SignalingServer`,
  raspGpioUrl: location.protocol === 'http:' ? `http://${window.location.hostname}:3080/gpio` : `https://${window.location.hostname}:3443/gpio`,
  raspPwmUrl: location.protocol === 'http:' ? `http://${window.location.hostname}:3080/pwm` : `https://${window.location.hostname}:3443/pwm`,
  videoUrl: location.protocol === 'http:' ? `http://${window.location.hostname}/hls/test.m3u8` : `https://${window.location.hostname}/hls/test.m3u8`,
  appId: 0,
  peerConnectionConfig: {
    'iceServers': [{ 'urls': 'stun:stun.l.google.com:19302' }]
  },
};
