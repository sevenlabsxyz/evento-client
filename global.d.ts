import type { Messages } from './messages/load';

declare global {
  // Typed message keys for next-intl: unknown keys fail `tsc`.
  // eslint-disable-next-line @typescript-eslint/no-empty-interface
  interface IntlMessages extends Messages {}
}
