import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { ToastProvider } from "@/components/ui/toast-container"
import { Providers } from "./providers"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Evento - Travel Itinerary App",
  description: "Plan and organize your travel events",
  generator: 'v0.dev',
  manifest: "/manifest.json",
  themeColor: "#0078d7",
  viewport: "width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Evento"
  },
  icons: {
    apple: "/assets/pwa/icon@512px.png"
  }
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Evento" />
        <link rel="apple-touch-icon" href="/assets/pwa/icon@512px.png" />
        <link rel="apple-touch-icon" sizes="180x180" href="/assets/pwa/icon@256px.png" />
        <link rel="apple-touch-icon" sizes="167x167" href="/assets/pwa/icon@256px.png" />
        <link rel="apple-touch-icon" sizes="152x152" href="/assets/pwa/icon@256px.png" />
        <link rel="apple-touch-icon" sizes="120x120" href="/assets/pwa/icon@256px.png" />
      </head>
      <body className={inter.className}>
        <Providers>
          <ToastProvider>
            {children}
          </ToastProvider>
        </Providers>
      </body>
    </html>
  )
}
