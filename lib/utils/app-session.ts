import { SESSION_KEYS } from '@/lib/constants/storage-keys';

const isBrowser = () => typeof window !== 'undefined';

export const getSessionValue = (key: string) => {
  if (!isBrowser()) return null;
  return sessionStorage.getItem(key);
};

export const setSessionValue = (key: string, value: string) => {
  if (!isBrowser()) return;
  sessionStorage.setItem(key, value);
};

export const getSessionFlag = (key: string) => getSessionValue(key) === 'true';

export const setSessionFlag = (key: string) => setSessionValue(key, 'true');

export const getInitialAppPath = () => getSessionValue(SESSION_KEYS.APP_INITIAL_PATH);

export const setInitialAppPath = (pathname: string) =>
  setSessionValue(SESSION_KEYS.APP_INITIAL_PATH, pathname);

export const hasAppNavigated = () => getSessionFlag(SESSION_KEYS.APP_HAS_NAVIGATED);

export const markAppNavigated = () => setSessionFlag(SESSION_KEYS.APP_HAS_NAVIGATED);
