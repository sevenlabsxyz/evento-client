"use client"

import { Sidebar } from "@/components/silk/Sidebar"

export default function EventoLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      <Sidebar />
      {children}
    </>
  )
}