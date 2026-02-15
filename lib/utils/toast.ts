import type { ReactNode } from 'react';
import { type ExternalToast, toast as sonnerToast } from 'sonner';

type ToastOptions = Omit<ExternalToast, 'description' | 'duration'>;

export const toast = {
  success: (description: ReactNode, title?: string, duration?: number, options?: ToastOptions) =>
    sonnerToast.success(title || 'Success', {
      description,
      duration: duration ?? 5000,
      ...options,
    }),

  error: (description: ReactNode, title?: string, duration?: number, options?: ToastOptions) =>
    sonnerToast.error(title || 'Error', {
      description,
      duration: duration ?? 5000,
      ...options,
    }),

  info: (description: ReactNode, title?: string, duration?: number, options?: ToastOptions) =>
    sonnerToast.info(title || 'Info', {
      description,
      duration: duration ?? 5000,
      ...options,
    }),

  warning: (description: ReactNode, title?: string, duration?: number, options?: ToastOptions) =>
    sonnerToast.warning(title || 'Warning', {
      description,
      duration: duration ?? 5000,
      ...options,
    }),

  custom: (
    content: Parameters<typeof sonnerToast.custom>[0],
    options?: Parameters<typeof sonnerToast.custom>[1]
  ) => sonnerToast.custom(content, options),

  dismiss: (id?: string | number) => sonnerToast.dismiss(id),

  clear: () => sonnerToast.dismiss(),
};
