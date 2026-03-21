import 'whatwg-fetch';

// Mock Web Crypto API for AES-GCM encryption tests - MUST be set unconditionally
// Node 19+ has crypto but it may not have all subtle methods we need
const mockCryptoKey = {} as CryptoKey;

const mockCrypto = {
  subtle: {
    importKey: () => Promise.resolve(mockCryptoKey),
    encrypt: async (algorithm: any, key: any, data: BufferSource) => {
      // Return encrypted data (IV + ciphertext simulation)
      const input = new Uint8Array(data as ArrayBuffer);
      const result = new Uint8Array(12 + input.length);
      // Fake IV
      for (let i = 0; i < 12; i++) result[i] = i;
      // Fake ciphertext (just copy input)
      for (let i = 0; i < input.length; i++) result[12 + i] = input[i] ^ 0x42;
      return result.buffer;
    },
    decrypt: async (algorithm: any, key: any, data: BufferSource) => {
      // Decrypt by reversing the encrypt mock
      const input = new Uint8Array(data as ArrayBuffer);
      if (input.length < 12) throw new Error('Invalid data');
      // Extract ciphertext (skip IV)
      const ciphertext = input.slice(12);
      // Reverse the XOR
      const result = new Uint8Array(ciphertext.length);
      for (let i = 0; i < ciphertext.length; i++) result[i] = ciphertext[i] ^ 0x42;
      return result.buffer;
    },
    digest: async (algorithm: string, data: BufferSource) => {
      // Return a 32-byte hash for SHA-256
      return new Uint8Array(32).buffer;
    },
    generateKey: () => Promise.resolve(mockCryptoKey),
    exportKey: () => Promise.resolve(new ArrayBuffer(32)),
    sign: () => Promise.resolve(new ArrayBuffer(64)),
    verify: () => Promise.resolve(true),
    deriveKey: () => Promise.resolve(mockCryptoKey),
    deriveBits: () => Promise.resolve(new ArrayBuffer(32)),
    wrapKey: () => Promise.resolve(new ArrayBuffer(64)),
    unwrapKey: () => Promise.resolve(mockCryptoKey),
  },
  getRandomValues: (arr: any) => {
    for (let i = 0; i < arr.length; i++) {
      arr[i] = Math.floor(Math.random() * 256);
    }
    return arr;
  },
  randomUUID: () => 'test-uuid-1234',
};

// Force override - critical for tests
(global as any).crypto = mockCrypto;

class BroadcastChannelMock {
  name: string;
  private static channels: Map<string, Set<BroadcastChannelMock>> = new Map();

  constructor(name: string) {
    this.name = name;
    if (!BroadcastChannelMock.channels.has(name)) {
      BroadcastChannelMock.channels.set(name, new Set());
    }
    BroadcastChannelMock.channels.get(name)!.add(this);
  }

  postMessage(message: any) {
    const channels = BroadcastChannelMock.channels.get(this.name);
    if (channels) {
      channels.forEach((channel) => {
        if (channel !== this && channel.onmessage) {
          channel.onmessage({ data: message } as MessageEvent);
        }
      });
    }
  }

  onmessage: ((event: MessageEvent) => void) | null = null;

  close() {
    const channels = BroadcastChannelMock.channels.get(this.name);
    if (channels) {
      channels.delete(this);
    }
  }

  addEventListener(type: string, listener: EventListener) {
    if (type === 'message') {
      this.onmessage = listener as any;
    }
  }

  removeEventListener() {}
}

if (typeof globalThis.BroadcastChannel === 'undefined') {
  (globalThis as any).BroadcastChannel = BroadcastChannelMock;
}

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
