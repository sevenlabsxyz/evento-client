import { DOCS_API_URL, DOCS_URL } from '@/lib/constants/external-links';

export const PUBLIC_API_BASE_URL = 'https://evento.so/api/public/v1';
export const EMBED_API_BASE_URL = 'https://evento.so/api/embed/v1';

export const API_KEYS_SETTINGS_PATH = '/e/settings/api-keys';
export const SETTINGS_PATH = '/e/settings';

/** Deep links into docs.evento.so used across the API landing page. */
export const API_DOCS = {
  overview: DOCS_API_URL,
  quickstart: `${DOCS_URL}/api/api-keys`,
  authentication: `${DOCS_URL}/api/authentication`,
  responseFormat: `${DOCS_URL}/api/response-format`,
  errorHandling: `${DOCS_URL}/api/error-handling`,
  dataModels: `${DOCS_URL}/api/data-models`,
  publicOverview: `${DOCS_URL}/api/public-api-overview`,
  embedOverview: `${DOCS_URL}/api/embed-api`,
  fetchEvent: `${DOCS_URL}/api/events`,
  fetchEventGuests: `${DOCS_URL}/api/event-guests`,
  fetchUserEvents: `${DOCS_URL}/api/users`,
  fetchEmbedEvent: `${DOCS_URL}/api/embed-event`,
  fetchEmbedUserEvents: `${DOCS_URL}/api/embed-user-events`,
  useCases: `${DOCS_URL}/guides/use-cases`,
  examples: `${DOCS_URL}/guides/examples`,
  reactComponents: `${DOCS_URL}/embed/react-components`,
} as const;
