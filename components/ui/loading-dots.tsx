'use client';

import { cn } from "@/lib/utils";
import { HTMLAttributes } from "react";

interface LoadingDotsProps extends HTMLAttributes<HTMLDivElement> {
  size?: "sm" | "md" | "lg";
  color?: string;
}

export function LoadingDots({ 
  size = "md", 
  color = "currentColor", 
  className, 
  ...props 
}: LoadingDotsProps) {
  return (
    <div
      className={cn("flex items-center space-x-1", className)}
      {...props}
    >
      {[1, 2, 3].map((dot) => (
        <div
          key={dot}
          className={cn(
            "animate-pulse rounded-full",
            {
              "h-1 w-1": size === "sm",
              "h-2 w-2": size === "md",
              "h-3 w-3": size === "lg",
            }
          )}
          style={{ backgroundColor: color }}
        />
      ))}
    </div>
  );
}
