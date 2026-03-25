const DEFAULT_APP_URL = 'https://app.evento.so';
const LOCAL_APP_URL = 'http://localhost:3003';

function normalizeAppUrl(value: string) {
  const withProtocol =
    value.startsWith('http://') || value.startsWith('https://') ? value : `https://${value}`;

  return withProtocol.replace(/\/+$/, '');
}

export function getAppUrl() {
  if (process.env.NODE_ENV === 'development') {
    return LOCAL_APP_URL;
  }

  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) {
    return normalizeAppUrl(process.env.VERCEL_PROJECT_PRODUCTION_URL);
  }

  if (process.env.VERCEL_URL) {
    return normalizeAppUrl(process.env.VERCEL_URL);
  }

  return DEFAULT_APP_URL;
}

export function getAbsoluteAppUrl(pathname: string) {
  return new URL(pathname, getAppUrl()).toString();
}
