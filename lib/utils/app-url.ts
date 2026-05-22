const DEFAULT_APP_URL = 'https://app.evento.so';
const LOCAL_APP_URL = 'http://localhost:3003';

function normalizeAppUrl(value: string) {
  const withProtocol =
    value.startsWith('http://') || value.startsWith('https://') ? value : `https://${value}`;

  return withProtocol.replace(/\/+$/, '');
}

export function getAppUrl(): string {
  if (process.env.NODE_ENV === 'development') {
    return LOCAL_APP_URL;
  }

  const configuredAppUrl = process.env.NEXT_PUBLIC_APP_URL ?? process.env.APP_URL;

  if (configuredAppUrl) {
    return normalizeAppUrl(configuredAppUrl);
  }

  return DEFAULT_APP_URL;
}

export function getAbsoluteAppUrl(pathname: string) {
  return new URL(pathname, getAppUrl()).toString();
}
