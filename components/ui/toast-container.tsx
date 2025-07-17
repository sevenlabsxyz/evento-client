"use client";
import { SilkToast } from "@/components/ui/silk-toast";
import { useToastManager } from "@/lib/hooks/use-toast-manager";
import { SheetStack } from "@silk-hq/components";
import React from "react";

// ================================================================================================
// Toast Container Component
// ================================================================================================

export const ToastContainer: React.FC = () => {
  const { toasts, removeToast } = useToastManager();

  if (toasts.length === 0) return null;

  return (
    <SheetStack.Root>
      {toasts.map((toast) => (
        <SilkToast
          key={toast.id}
          id={toast.id}
          type={toast.type}
          title={toast.title}
          description={toast.description}
          duration={toast.duration}
          onDismiss={() => removeToast(toast.id)}
        />
      ))}
    </SheetStack.Root>
  );
};

// ================================================================================================
// Provider Component (for app-wide usage)
// ================================================================================================

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  return (
    <>
      {children}
      <ToastContainer />
    </>
  );
};
