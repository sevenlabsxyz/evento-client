"use client";

import { TopBar } from "@/components/top-bar";
import { useTopBar } from "@/lib/stores/topbar-store";

export default function EventoLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isTransparent } = useTopBar();

  return (
    <>
      <TopBar />
      <div className={isTransparent ? "" : "pt-24"}>{children}</div>
    </>
  );
}
