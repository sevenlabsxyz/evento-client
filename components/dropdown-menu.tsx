"use client";

import type React from "react";

import { useEffect, useRef, useState } from "react";

interface DropdownMenuItem {
  label: string;
  icon: React.ReactNode;
  action: () => void;
  destructive?: boolean;
}

interface DropdownMenuProps {
  trigger: React.ReactNode;
  items: DropdownMenuItem[];
  align?: "left" | "right";
}

export function DropdownMenu({
  trigger,
  items,
  align = "right",
}: DropdownMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      <div onClick={() => setIsOpen(!isOpen)}>{trigger}</div>

      {isOpen && (
        <div
          className={`absolute top-full z-50 mt-2 w-64 rounded-2xl border border-gray-200 bg-white py-2 shadow-xl ${
            align === "right" ? "right-0" : "left-0"
          }`}
        >
          {items.map((item, index) => (
            <button
              key={index}
              onClick={() => {
                item.action();
                setIsOpen(false);
              }}
              className={`flex w-full items-center justify-between px-4 py-3 text-left transition-colors hover:bg-gray-50 ${
                item.destructive ? "text-red-500" : "text-gray-900"
              }`}
            >
              <span className="font-medium">{item.label}</span>
              <div
                className={`flex h-6 w-6 items-center justify-center ${
                  item.destructive ? "text-red-500" : "text-gray-600"
                }`}
              >
                {item.icon}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
