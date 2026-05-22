export function getAppUrl(): string {
  return process.env.NEXT_PUBLIC_APP_URL ?? process.env.APP_URL ?? 'https://app.evento.so';
}

export function getAbsoluteAppUrl(pathname: string) {
  return new URL(pathname, getAppUrl()).toString();
}
