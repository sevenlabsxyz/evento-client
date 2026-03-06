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
    hostname: 'blogapi.evento.so',
    pathname: '/content/images/**',
  },
  {
    protocol: 'https',
    hostname: 'laughing-sunfish.pikapod.net',
    pathname: '/content/images/**',
  },
  {
    protocol: 'https',
    hostname: '**.ghost.io',
    pathname: '/content/images/**',
  },
  {
    protocol: 'https',
    hostname: 'static.ghost.org',
    pathname: '/**',
  },
];

const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
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
  async redirects() {
    return [
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
