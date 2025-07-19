"use client";

import { Button } from "@/components/ui/button";
import { Bell, Calendar, Layers, MessageCircle, Plus } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";

interface NavbarProps {
  activeTab?: string;
  onTabChange?: (tab: string) => void;
}

export function Navbar({ activeTab, onTabChange }: NavbarProps) {
  const router = useRouter();
  const pathname = usePathname();

  const navItems = [
    { id: "hub", icon: Calendar, path: "/" },
    { id: "feed", icon: Layers, path: "/e/feed" },
    { id: "add", icon: Plus, path: "/e/create", isCenter: true },
    { id: "notifications", icon: Bell, path: "/e/notifications" },
    { id: "messages", icon: MessageCircle, path: "/e/messages" },
  ];

  const handleNavigation = (item: any) => {
    if (onTabChange) {
      onTabChange(item.id);
    }
    router.push(item.path);
  };

  return (
    <div className="fixed bottom-0 left-1/2 z-10 w-full max-w-full -translate-x-1/2 transform border-t border-gray-200 bg-white md:max-w-sm">
      <div className="grid grid-cols-5 items-center px-2 py-3">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.path || activeTab === item.id;

          if (item.isCenter) {
            return (
              <div key={item.id} className="flex justify-center">
                <Button
                  size="icon"
                  className="h-14 w-14 rounded-full bg-red-500 shadow-lg hover:bg-red-600"
                  onClick={() => handleNavigation(item)}
                >
                  <Icon className="h-9 w-9 stroke-2 font-bold text-white" />
                </Button>
              </div>
            );
          }

          return (
            <button
              key={item.id}
              onClick={() => handleNavigation(item)}
              className={`flex justify-center rounded-lg px-1 py-3 transition-colors ${
                isActive ? "text-red-600" : "text-gray-500 hover:text-gray-700"
              }`}
            >
              <Icon className={`h-6 w-6 ${isActive ? "text-red-600" : ""}`} />
            </button>
          );
        })}
      </div>
    </div>
  );
}
