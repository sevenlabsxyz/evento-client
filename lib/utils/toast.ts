import { toast as sonnerToast } from 'sonner';

export const toast = {
  success: (description: string, title?: string, duration?: number) =>
    sonnerToast.success(title || 'Success', {
      description,
      duration: duration ?? 5000,
    }),

  error: (description: string, title?: string, duration?: number) =>
    sonnerToast.error(title || 'Error', {
      description,
      duration: duration ?? 5000,
    }),

  info: (description: string, title?: string, duration?: number) =>
    sonnerToast.info(title || 'Info', {
      description,
      duration: duration ?? 5000,
    }),

  warning: (description: string, title?: string, duration?: number) =>
    sonnerToast.warning(title || 'Warning', {
      description,
      duration: duration ?? 5000,
    }),

  dismiss: (id?: string | number) => sonnerToast.dismiss(id),

  clear: () => sonnerToast.dismiss(),
};
