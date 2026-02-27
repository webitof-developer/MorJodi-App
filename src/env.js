// Centralized runtime configuration for the app.
// These values are assigned to global.__APP_ENV__ so config.js can read them.
// Update them per environment; avoid scattering constants across the codebase.
const ENV = {
  // API_BASE_URL: 'https://api.morjodi.com',
  // // API_BASE_URL: 'http://192.168.1.62:5000',
  API_BASE_URL: 'http://10.99.44.194:5000',
  // // // API_BASE_URL: 'http://172.20.10.2:5000', 

  WEB_CLIENT_ID:
    '726734031211-5mntkg08viop2ri8qqql7h8u857rf3mt.apps.googleusercontent.com',
  AGORA_APP_ID: 'd8ce33273d154ad0a26326d3c8eac9d9',
};

if (typeof global !== 'undefined') {
  global.__APP_ENV__ = ENV;
}

export default ENV;
