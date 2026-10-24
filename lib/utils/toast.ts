import { translateHooks } from '@/lib/i18n/active-translator';
import type { ReactNode } from 'react';
import { type ExternalToast, toast as sonnerToast } from 'sonner';

type ToastOptions = Omit<ExternalToast, 'description' | 'duration'>;

export const toast = {
  success: (description: ReactNode, title?: string, duration?: number, options?: ToastOptions) =>
    sonnerToast.success(title || translateHooks('toast.success'), {
      description,
      duration: duration ?? 5000,
      ...options,
    }),

  error: (description: ReactNode, title?: string, duration?: number, options?: ToastOptions) =>
    sonnerToast.error(title || translateHooks('toast.error'), {
      description,
      duration: duration ?? 5000,
      ...options,
    }),

  info: (description: ReactNode, title?: string, duration?: number, options?: ToastOptions) =>
    sonnerToast.info(title || translateHooks('toast.info'), {
      description,
      duration: duration ?? 5000,
      ...options,
    }),

  warning: (description: ReactNode, title?: string, duration?: number, options?: ToastOptions) =>
    sonnerToast.warning(title || translateHooks('toast.warning'), {
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
