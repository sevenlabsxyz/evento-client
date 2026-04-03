export const DEFAULT_CHAT_RELAYS = [
  'wss://relay.damus.io',
  'wss://nos.lol',
  'wss://relay.primal.net',
  'wss://relay.snort.social',
] as const;

export const CHAT_KEY_PACKAGE_CLIENT = 'evento-client';
export const CHAT_GROUP_HISTORY_LOOKBACK_SECONDS = 60 * 60 * 24 * 30;
export const CHAT_INVITE_LOOKBACK_SECONDS = 60 * 60 * 24 * 30;

export const CHAT_STORAGE_KEYS = {
  onboardingComplete: 'onboarding-complete',
  account: 'account',
} as const;
