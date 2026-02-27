import axios from 'axios';

const DEFAULT_TIMEOUT_MS = Number(process.env.AXIOS_TIMEOUT_MS || 12000);
const MAX_RETRIES = Number(process.env.AXIOS_MAX_RETRIES || 2);
const RETRY_BASE_DELAY_MS = Number(process.env.AXIOS_RETRY_BASE_DELAY_MS || 300);

let installed = false;

const parseRetryAfterMs = (value) => {
  if (!value) return null;
  const numeric = Number(value);
  if (Number.isFinite(numeric) && numeric >= 0) {
    return numeric * 1000;
  }
  const dateMs = Date.parse(String(value));
  if (Number.isNaN(dateMs)) return null;
  const diff = dateMs - Date.now();
  return diff > 0 ? diff : 0;
};

const shouldRetry = (error) => {
  const config = error?.config || {};
  const method = String(config.method || 'get').toLowerCase();
  const status = error?.response?.status;
  const isNetworkError = !error?.response;
  const isRetriableStatus = status === 429 || (status >= 500 && status <= 599);

  if (config.__noRetry === true) return false;
  if (method !== 'get') return false;
  return isNetworkError || isRetriableStatus;
};

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export const installNetworkClient = () => {
  if (installed) return;
  installed = true;

  axios.defaults.timeout = DEFAULT_TIMEOUT_MS;
  axios.defaults.headers.common['X-Client-App'] = 'morjodi-mobile';

  axios.interceptors.request.use((config) => {
    const next = { ...config };
    if (!next.metadata) {
      next.metadata = {};
    }
    next.metadata.startedAt = Date.now();
    return next;
  });

  axios.interceptors.response.use(
    (response) => response,
    async (error) => {
      const config = error?.config;
      if (!config || !shouldRetry(error)) {
        return Promise.reject(error);
      }

      const nextRetryCount = Number(config.__retryCount || 0) + 1;
      config.__retryCount = nextRetryCount;
      if (nextRetryCount > MAX_RETRIES) {
        return Promise.reject(error);
      }

      const retryAfterHeader = error?.response?.headers?.['retry-after'];
      const retryAfterMs = parseRetryAfterMs(retryAfterHeader);
      const expDelay = RETRY_BASE_DELAY_MS * (2 ** (nextRetryCount - 1));
      const jitter = Math.floor(Math.random() * 120);
      const waitMs = Math.min(4000, Math.max(retryAfterMs ?? 0, expDelay + jitter));

      await sleep(waitMs);
      return axios(config);
    },
  );
};

