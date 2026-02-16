import { Toaster } from '@/components/ui/sonner';
import { Analytics } from '@vercel/analytics/next';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import type React from 'react';
import './globals.css';
import { Providers } from './providers';

const inter = Inter({ subsets: ['latin'] });
const appUrl =
  process.env.NODE_ENV === 'development' ? 'http://localhost:3003' : 'https://app.evento.so';

export const metadata: Metadata = {
  metadataBase: new URL(appUrl),
  title: 'Evento - Events made social',
  description: 'Create, manage and oversee events and communities',
  generator: 'v0.dev',
  twitter: {
    title: 'Evento - Events made social',
    card: 'summary_large_image',
    site: '@evento',
    creator: '@evento_so',
    images: 'https://i.imgur.com/dTclM4m.png',
  },
  openGraph: {
    type: 'website',
    url: 'https://app.evento.so',
    title: 'Evento - Events made social',
    description: 'Events made social.',
    siteName: 'Evento - Events made social',
    images: [
      {
        url: 'https://i.imgur.com/dTclM4m.png',
      },
    ],
  },
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Evento',
  },
  icons: {
    icon: '/icon.png',
    apple: '/assets/pwa/icon@512px.png',
  },
};

export const viewport = {
  themeColor: '#ffffff',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  interactiveWidget: 'resizes-content',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang='en'>
      <head>
        <meta name='mobile-web-app-capable' content='yes' />
        <meta name='apple-mobile-web-app-capable' content='yes' />
        <meta name='apple-mobile-web-app-status-bar-style' content='black-translucent' />
        <meta name='apple-mobile-web-app-title' content='Evento' />
        <link rel='apple-touch-icon' href='/assets/pwa/icon@512px.png' />
        <link rel='apple-touch-icon' sizes='180x180' href='/assets/pwa/icon@256px.png' />
        <link rel='apple-touch-icon' sizes='167x167' href='/assets/pwa/icon@256px.png' />
        <link rel='apple-touch-icon' sizes='152x152' href='/assets/pwa/icon@256px.png' />
        <link rel='apple-touch-icon' sizes='120x120' href='/assets/pwa/icon@256px.png' />
      </head>
      <body className={inter.className}>
        <Providers>
          {children}
          <Toaster />
          <Analytics />
        </Providers>
      </body>
    </html>
  );
}
