import { Buffer } from 'buffer';

const decodeJwtPayload = token => {
  if (!token || typeof token !== 'string') return null;
  const parts = token.split('.');
  if (parts.length < 2) return null;

  try {
    const payloadBase64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const padded = payloadBase64 + '='.repeat((4 - (payloadBase64.length % 4)) % 4);
    const json = Buffer.from(padded, 'base64').toString('utf8');
    return JSON.parse(json);
  } catch (error) {
    return null;
  }
};

export const isTokenExpired = token => {
  const payload = decodeJwtPayload(token);
  const exp = payload?.exp;

  if (!exp || Number.isNaN(exp)) return true;
  return Date.now() >= Number(exp) * 1000;
};
