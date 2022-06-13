// The file contents for the current environment will overwrite these during build.
// The build system defaults to the dev environment which uses `environment.ts`, but if you do
// `ng build --env=prod` then `environment.prod.ts` will be used instead.
// The list of which env maps to which file can be found in `.angular-cli.json`.

// "ng build" or "ng serve" only
export const environment = {
  production: false,
  authUrl: location.protocol === 'http:' ? `http://richard-greenhouse:5080/api` : `http://richard-greenhouse:5443/api`,
  greenhouseUrl: location.protocol === 'http:' ? `http://richard-greenhouse:6080/api` : `http://richard-greenhouse:6443/api`,
  sensorHubUrl: location.protocol === 'http:' ? `http://richard-greenhouse:6080/SensorHub` : `http://richard-greenhouse:6443/api`,
  raspGpioUrl: `http://richard-greenhouse:3080/gpio`,
  raspPwmUrl: `http://richard-greenhouse:3080/pwm`,
  appId: 0,
};