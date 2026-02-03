// Jest pre-environment polyfills and env setup
// Load fetch/Request/Response/Headers for Node test runtime
import 'whatwg-fetch';

// Ensure TextEncoder/TextDecoder are available (used by some libs)
// Node provides these via 'util' in CommonJS
// @ts-ignore
import { TextDecoder, TextEncoder } from 'util';
// @ts-ignore
if (!global.TextEncoder) global.TextEncoder = TextEncoder as any;
// @ts-ignore
if (!global.TextDecoder) global.TextDecoder = TextDecoder as any;

// Provide Web Streams APIs required by MSW/@mswjs/interceptors
// Prefer Node's built-in impl from 'stream/web' if available
// @ts-ignore
try {
  // @ts-ignore
  const { ReadableStream, WritableStream, TransformStream } = require('stream/web');
  // @ts-ignore
  if (!global.ReadableStream) global.ReadableStream = ReadableStream;
  // @ts-ignore
  if (!global.WritableStream) global.WritableStream = WritableStream;
  // @ts-ignore
  if (!global.TransformStream) global.TransformStream = TransformStream;
} catch {}

// Polyfill matchMedia for component libraries that rely on it
// jsdom doesn't implement matchMedia by default
if (!(global as any).matchMedia) {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: (query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: () => {}, // deprecated
      removeListener: () => {}, // deprecated
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
    }),
  });
}

// Polyfill CSS.supports for libraries that probe CSS feature support
// jsdom doesn't implement CSS.supports by default
// Always return true to follow “progressive enhancement” paths
if (!(window as any).CSS) {
  (window as any).CSS = {} as any;
}
if (typeof (window as any).CSS.supports !== 'function') {
  (window as any).CSS.supports = () => true;
}

// Ensure axios base URL points to local during tests BEFORE modules import Env
process.env.NEXT_PUBLIC_API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost';

// Provide Supabase env vars required by lib/supabase/client.ts in tests
process.env.NEXT_PUBLIC_SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://example.supabase.co';
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'test_anon_key';
