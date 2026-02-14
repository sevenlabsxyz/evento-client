import { type ExternalToast, toast as sonnerToast } from 'sonner';

type ToastOptions = Omit<ExternalToast, 'description' | 'duration'>;

export const toast = {
  success: (description: string, title?: string, duration?: number, options?: ToastOptions) =>
    sonnerToast.success(title || 'Success', {
      description,
      duration: duration ?? 5000,
      ...options,
    }),

  error: (description: string, title?: string, duration?: number, options?: ToastOptions) =>
    sonnerToast.error(title || 'Error', {
      description,
      duration: duration ?? 5000,
      ...options,
    }),

  info: (description: string, title?: string, duration?: number, options?: ToastOptions) =>
    sonnerToast.info(title || 'Info', {
      description,
      duration: duration ?? 5000,
      ...options,
    }),

  warning: (description: string, title?: string, duration?: number, options?: ToastOptions) =>
    sonnerToast.warning(title || 'Warning', {
      description,
      duration: duration ?? 5000,
      ...options,
    }),

  dismiss: (id?: string | number) => sonnerToast.dismiss(id),

  clear: () => sonnerToast.dismiss(),
};
