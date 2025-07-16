"use client"

import { TopBar } from "@/components/top-bar"

export default function EventoLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      <TopBar />
      <div className="pt-24">
        {children}
      </div>
    </>
  )
}