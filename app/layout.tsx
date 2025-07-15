import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { ToastProvider } from "@/components/ui/toast-container"
import { Providers } from "./providers"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Evento - Events made social",
  description: "Create, manage and oversee events and communities",
  generator: 'v0.dev',
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Evento"
  },
  icons: {
    apple: "/assets/pwa/icon@512px.png"
  }
}

export const viewport = {
  themeColor: "#ffffff",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
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
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
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
