/** @type {import('next').NextConfig} */
function getGhostHostname() {
  const ghostUrl = process.env.NEXT_PUBLIC_GHOST_URL;

  if (!ghostUrl) {
    return null;
  }

  try {
    return new URL(ghostUrl).hostname;
  } catch {
    return null;
  }
}

const ghostHostname = getGhostHostname();

const ghostRemotePatterns = [
  ...(ghostHostname
    ? [
        {
          protocol: 'https',
          hostname: ghostHostname,
          pathname: '/content/images/**',
        },
      ]
    : []),
  {
    protocol: 'https',
    hostname: 'blog.evento.so',
    pathname: '/content/images/**',
  },
  {
    protocol: 'https',
    hostname: 'laughing-sunfish.pikapod.net',
    pathname: '/content/images/**',
  },
];

function getApiHostname() {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;

  if (!apiUrl) {
    return null;
  }

  try {
    return new URL(apiUrl).hostname;
  } catch {
    return null;
  }
}

const apiHostname = getApiHostname();

// Content-Security-Policy — every host is referenced in the app code (see the
// git history / audit report for grep evidence per host):
// - script-src: analytics.seven.sx (app/layout.tsx), telegram.org
//   (telegram-connect-sheet.tsx widget), maps.googleapis.com
//   (use-google-places.ts). 'unsafe-eval' is required by next dev (and the
//   Breez WASM); 'unsafe-inline' is required by the Telegram widget's
//   data-onauth callback. Follow-up: move to a nonce-based policy.
// - connect-src: api hosts (env.ts NEXT_PUBLIC_API_URL, hardcoded
//   api.evento.so storage URLs), Supabase (auth + realtime, browser client),
//   mempool.space (speed-up fees) / api.coingecko.com (btc-price) /
//   api.giphy.com (giphy-picker) / api.openweathermap.org (weather) — all
//   fetched from the browser; stream-chat (chat.stream-io-api.com REST + WSS);
//   Breez spark SDK defaults (defaultConfig('mainnet'): datasync:442,
//   spark-operator.breez.technology, 0.spark.lightspark.com,
//   2.spark.flashnet.xyz, api.lightspark.com, blockstream.info chain service,
//   bsw1/nd1.breez.technology, lnurlDomain evento.cash); api.zebedee.io /
//   api.zbdpay.com (LNURL proxy allowlist). LNURL fetches to arbitrary
//   third-party lightning-address domains are not allowed; send flows fall
//   back to the /api/v1/lightning/lnurl proxy (same-origin).
// - frame-src: www.google.com (maps embed), wavlake.evento.so (wavlake
//   embed), embed.bitrefill.com (spend bitcoin), telegram.org +
//   oauth.telegram.org (telegram login widget iframe),
//   open.spotify.com (react-spotify-embed).
// - style-src needs 'unsafe-inline' for the many inline style attributes
//   (framer-motion etc.); without it default-src 'self' breaks the whole UI.
const csp = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://telegram.org https://analytics.seven.sx https://maps.googleapis.com",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https:",
  "font-src 'self' data:",
  `connect-src 'self' https://evento.so https://api.evento.so https://*.supabase.co wss://*.supabase.co https://mempool.space https://api.zebedee.io https://api.zbdpay.com https://*.breez.technology https://datasync.breez.technology:442 wss://*.breez.technology https://0.spark.lightspark.com https://2.spark.flashnet.xyz https://api.lightspark.com https://blockstream.info https://evento.cash https://demo.evento.cash https://api.coingecko.com https://chat.stream-io-api.com wss://chat.stream-io-api.com https://api.giphy.com https://api.openweathermap.org https://maps.googleapis.com${ghostHostname ? ` https://${ghostHostname}` : ''}${apiHostname ? ` https://${apiHostname}` : ''}`,
  "frame-src 'self' https://www.google.com https://wavlake.evento.so https://embed.bitrefill.com https://telegram.org https://oauth.telegram.org https://open.spotify.com",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  "worker-src 'self' blob:",
  'upgrade-insecure-requests',
].join('; ');

const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  experimental: {
    optimizeCss: true,
  },
  images: {
    unoptimized: false,
    remotePatterns: [
      ...ghostRemotePatterns,
      {
        protocol: 'https',
        hostname: 'evento.so',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'api.evento.so',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'media.giphy.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'media0.giphy.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'media1.giphy.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'media2.giphy.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'media3.giphy.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'media4.giphy.com',
        pathname: '/**',
      },
    ],
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: csp,
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(self), microphone=(), geolocation=(self)',
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains',
          },
        ],
      },
    ];
  },
  async redirects() {
    return [
      {
        source: '/blog',
        destination: '/e/blog',
        permanent: true,
      },
      {
        source: '/blog/:slug',
        destination: '/e/blog/:slug',
        permanent: true,
      },
      {
        source: '/login',
        destination: '/auth/login',
        permanent: true,
      },
      {
        source: '/signup',
        destination: '/auth/login',
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
