// Load from runtime env/global to avoid hardcoding secrets in the bundle.
// Set these via build-time env (e.g., React Native Config or Metro env).
const runtimeEnv = (global && global.__APP_ENV__) || {};
const env = (typeof process !== 'undefined' && process.env) || {};

export const API_BASE_URL =
  runtimeEnv.API_BASE_URL ||
  env.API_BASE_URL ||
  ''; // required: backend base URL

export const WEB_CLIENT_ID =
  runtimeEnv.WEB_CLIENT_ID ||
  env.WEB_CLIENT_ID ||
  ''; // required: Google OAuth client ID

export const AGORA_APP_ID =
  runtimeEnv.AGORA_APP_ID ||
  env.AGORA_APP_ID ||
  ''; // required: Agora App ID

if (__DEV__) {
  if (!API_BASE_URL) {
    console.warn('[config] API_BASE_URL is not set. Please provide it via env.');
  }
  if (!WEB_CLIENT_ID) {
    console.warn('[config] WEB_CLIENT_ID is not set. Google login will fail.');
  }
  if (!AGORA_APP_ID) {
    console.warn('[config] AGORA_APP_ID is not set. Voice/video will fail.');
  }
}
