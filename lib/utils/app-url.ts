function normalizeAppUrl(value: string) {
  const withProtocol =
    value.startsWith('http://') || value.startsWith('https://') ? value : `https://${value}`;

  return withProtocol.replace(/\/+$/, '');
}

export function getAppUrl(): string {
  return normalizeAppUrl(
    process.env.NEXT_PUBLIC_APP_URL ?? process.env.APP_URL ?? 'https://app.evento.so'
  );
}

export function getAbsoluteAppUrl(pathname: string) {
  return new URL(pathname, getAppUrl()).toString();
}
