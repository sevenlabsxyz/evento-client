"use client";
import { useState, useEffect } from "react";
import { toastManager } from "@/lib/utils/toast";

// ================================================================================================
// Hook for Global Toast Manager
// ================================================================================================

export const useToastManager = () => {
  const [toasts, setToasts] = useState(() => toastManager.getToasts());

  useEffect(() => {
    const unsubscribe = toastManager.subscribe(setToasts);
    return unsubscribe;
  }, []);

  const removeToast = (id: string) => {
    toastManager.remove(id);
  };

  return {
    toasts,
    removeToast,
  };
};