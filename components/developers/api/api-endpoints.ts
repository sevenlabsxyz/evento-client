import { API_DOCS, EMBED_API_BASE_URL, PUBLIC_API_BASE_URL } from './api-links';
import type { CodeSnippet } from './code-panel';

/*
 * Every request, parameter, and response below is taken from docs.evento.so.
 * Responses are trimmed excerpts of the documented examples (fields omitted, never invented).
 */

export type ApiSurface = 'public' | 'embed';

export interface ApiEndpointParam {
  name: string;
  location: 'path' | 'query';
  type: string;
  description: string;
  required?: boolean;
}

export interface ApiEndpoint {
  id: string;
  surface: ApiSurface;
  method: 'GET';
  path: string;
  title: string;
  description: string;
  params: ApiEndpointParam[];
  note?: string;
  request: string;
  response: string;
  docsUrl: string;
}

export const API_SURFACE_LABEL: Record<ApiSurface, string> = {
  public: 'Public API',
  embed: 'Embed API',
};

export const API_SURFACE_BASE_URL: Record<ApiSurface, string> = {
  public: PUBLIC_API_BASE_URL,
  embed: EMBED_API_BASE_URL,
};

const toJson = (value: unknown) => JSON.stringify(value, null, 2);

export const API_ENDPOINTS: ApiEndpoint[] = [
  {
    id: 'public-event',
    surface: 'public',
    method: 'GET',
    path: '/events/{eventId}',
    title: 'Fetch event',
    description:
      'Retrieve detailed information for a published public event, including creator, links, and contribution metadata.',
    params: [
      {
        name: 'eventId',
        location: 'path',
        type: 'string',
        description: 'Unique event identifier.',
        required: true,
      },
    ],
    request: `curl ${PUBLIC_API_BASE_URL}/events/evt_abc123 \\
  -H "x-evento-api-key: YOUR_API_KEY"`,
    response: toJson({
      success: true,
      message: 'Event details fetched successfully',
      data: {
        id: 'evt_abc123',
        title: 'Tech Meetup 2026',
        location: 'San Francisco, CA',
        start_date: '2026-06-15T18:00:00Z',
        timezone: 'America/Los_Angeles',
        visibility: 'public',
        cost: 25,
        creator: {
          username: 'techorg',
          verification_status: 'verified',
        },
      },
    }),
    docsUrl: API_DOCS.fetchEvent,
  },
  {
    id: 'public-event-guests',
    surface: 'public',
    method: 'GET',
    path: '/events/{eventId}/guests',
    title: 'Fetch event guests',
    description: 'Retrieve RSVP guests for a published public event, filtered by RSVP status.',
    params: [
      {
        name: 'eventId',
        location: 'path',
        type: 'string',
        description: 'Unique event identifier.',
        required: true,
      },
      {
        name: 'status',
        location: 'query',
        type: 'string',
        description: 'RSVP filter: yes, maybe, no, or all. Defaults to yes.',
      },
      {
        name: 'limit',
        location: 'query',
        type: 'integer',
        description: 'Results per page, 1–100. Defaults to 10.',
      },
      {
        name: 'offset',
        location: 'query',
        type: 'integer',
        description: 'Pagination offset. Defaults to 0.',
      },
    ],
    note: 'Emails, phone numbers, and private contact details are never returned. Only guests linked to user profiles are included.',
    request: `curl "${PUBLIC_API_BASE_URL}/events/evt_abc123/guests?limit=20&status=yes" \\
  -H "x-evento-api-key: YOUR_API_KEY"`,
    response: toJson({
      success: true,
      message: 'Guest list fetched successfully for event evt_abc123',
      data: [
        {
          id: 'usr_123',
          username: 'johndoe',
          name: 'John Doe',
          verification_status: 'verified',
          rsvp_status: 'yes',
          rsvp_date: '2026-06-01T10:30:00Z',
        },
      ],
    }),
    docsUrl: API_DOCS.fetchEventGuests,
  },
  {
    id: 'public-user-events',
    surface: 'public',
    method: 'GET',
    path: '/users/{username}/events',
    title: 'Fetch user events',
    description:
      'List public events by username, with upcoming, past, or profile filters and pagination.',
    params: [
      {
        name: 'username',
        location: 'path',
        type: 'string',
        description: 'Username, case-insensitive, without the @ prefix.',
        required: true,
      },
      {
        name: 'type',
        location: 'query',
        type: 'string',
        description: 'Optional filter: upcoming, past, or profile.',
      },
      {
        name: 'limit',
        location: 'query',
        type: 'integer',
        description: 'Results per page, max 100. Defaults to 20.',
      },
      {
        name: 'offset',
        location: 'query',
        type: 'integer',
        description: 'Pagination offset. Defaults to 0.',
      },
    ],
    request: `curl "${PUBLIC_API_BASE_URL}/users/johndoe/events?type=upcoming&limit=10" \\
  -H "x-evento-api-key: YOUR_API_KEY"`,
    response: toJson({
      success: true,
      message: 'Events fetched successfully',
      data: {
        events: [
          {
            id: 'evt_future1',
            title: 'Summer Festival 2026',
            location: 'Central Park, NY',
            start_date: '2026-06-21T14:00:00Z',
            timezone: 'America/New_York',
          },
        ],
        pagination: { limit: 10, offset: 0, total: 1 },
      },
    }),
    docsUrl: API_DOCS.fetchUserEvents,
  },
  {
    id: 'embed-event',
    surface: 'embed',
    method: 'GET',
    path: '/events/{eventId}',
    title: 'Fetch embed event',
    description:
      'Retrieve a compact, embed-optimized event payload by ID — ready for event cards and detail embeds.',
    params: [
      {
        name: 'eventId',
        location: 'path',
        type: 'string',
        description: 'Unique event identifier.',
        required: true,
      },
    ],
    request: `curl ${EMBED_API_BASE_URL}/events/evt_abc123`,
    response: toJson({
      success: true,
      message: 'Event fetched successfully',
      data: {
        id: 'evt_abc123',
        title: 'Tech Meetup 2026',
        start_date: '2026-12-15T18:00:00Z',
        location: {
          name: 'Tech Hub SF',
          city: 'San Francisco',
          country: 'United States',
        },
        url: 'https://evento.so/e/evt_abc123',
        status: 'upcoming',
      },
    }),
    docsUrl: API_DOCS.fetchEmbedEvent,
  },
  {
    id: 'embed-user-events',
    surface: 'embed',
    method: 'GET',
    path: '/users/{username}/events',
    title: 'Fetch embed user events',
    description:
      'Retrieve an embed-optimized event feed for a creator, with optional inclusive date bounds.',
    params: [
      {
        name: 'username',
        location: 'path',
        type: 'string',
        description: 'Username, case-insensitive.',
        required: true,
      },
      {
        name: 'from',
        location: 'query',
        type: 'string',
        description: 'Inclusive start datetime (ISO 8601).',
      },
      {
        name: 'to',
        location: 'query',
        type: 'string',
        description: 'Inclusive end datetime (ISO 8601).',
      },
      {
        name: 'limit',
        location: 'query',
        type: 'integer',
        description: 'Number of events to return, max 100. Defaults to 50.',
      },
    ],
    note: 'Each event’s status is computed from its start and end timestamps: upcoming, ongoing, or past.',
    request: `curl "${EMBED_API_BASE_URL}/users/johndoe/events?from=2026-01-01T00:00:00Z&limit=10"`,
    response: toJson({
      success: true,
      message: 'Events fetched successfully',
      data: [
        {
          id: 'evt_123',
          title: 'Monthly Tech Talks',
          start_date: '2026-06-15T18:00:00Z',
          url: 'https://evento.so/e/evt_123',
          status: 'upcoming',
        },
      ],
    }),
    docsUrl: API_DOCS.fetchEmbedUserEvents,
  },
];

/** Hero request snippets, verbatim from the Authentication and Fetch event docs. */
export const HERO_REQUEST_SNIPPETS: CodeSnippet[] = [
  {
    id: 'curl',
    label: 'cURL',
    language: 'bash',
    code: `curl ${PUBLIC_API_BASE_URL}/events/evt_abc123 \\
  -H "x-evento-api-key: YOUR_API_KEY"`,
  },
  {
    id: 'javascript',
    label: 'JavaScript',
    language: 'javascript',
    code: `const response = await fetch('${PUBLIC_API_BASE_URL}/events/evt_abc123', {
  headers: {
    'x-evento-api-key': process.env.EVENTO_API_KEY
  }
});

const data = await response.json();`,
  },
  {
    id: 'python',
    label: 'Python',
    language: 'python',
    code: `import os
import requests

response = requests.get(
    '${PUBLIC_API_BASE_URL}/events/evt_abc123',
    headers={'x-evento-api-key': os.environ['EVENTO_API_KEY']}
)

payload = response.json()`,
  },
];

export const HERO_RESPONSE_SNIPPET: CodeSnippet = {
  id: 'response',
  label: 'Response',
  language: 'json',
  code: toJson({
    success: true,
    message: 'Event details fetched successfully',
    data: {
      id: 'evt_abc123',
      title: 'Tech Meetup 2026',
      location: 'San Francisco, CA',
      start_date: '2026-06-15T18:00:00Z',
      timezone: 'America/Los_Angeles',
      creator: {
        username: 'techorg',
        verification_status: 'verified',
      },
    },
  }),
};
