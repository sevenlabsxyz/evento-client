'use client';
import { type ToastType } from '@/lib/contexts/toast-context';

// ================================================================================================
// Global Toast Manager
// ================================================================================================

type ToastInstance = {
	id: string;
	type: ToastType;
	title?: string;
	description: string;
	duration?: number;
	onDismiss?: () => void;
};

class ToastManager {
	private toasts: ToastInstance[] = [];
	private listeners: ((toasts: ToastInstance[]) => void)[] = [];
	private idCounter = 0;

	private notify() {
		this.listeners.forEach((listener) => listener([...this.toasts]));
	}

	subscribe(listener: (toasts: ToastInstance[]) => void) {
		this.listeners.push(listener);
		return () => {
			this.listeners = this.listeners.filter((l) => l !== listener);
		};
	}

	add(toast: Omit<ToastInstance, 'id'>) {
		const id = `toast-${this.idCounter++}`;
		const newToast: ToastInstance = {
			id,
			...toast,
			duration: toast.duration ?? 5000,
		};

		this.toasts.push(newToast);
		this.notify();
		return id;
	}

	remove(id: string) {
		this.toasts = this.toasts.filter((toast) => toast.id !== id);
		this.notify();
	}

	clear() {
		this.toasts = [];
		this.notify();
	}

	getToasts() {
		return [...this.toasts];
	}
}

// ================================================================================================
// Global Instance
// ================================================================================================

const toastManager = new ToastManager();

// ================================================================================================
// Toast API Functions
// ================================================================================================

export const toast = {
	success: (description: string, title?: string, duration?: number) =>
		toastManager.add({
			type: 'success',
			description,
			title: title || 'Success',
			duration,
		}),

	error: (description: string, title?: string, duration?: number) =>
		toastManager.add({
			type: 'error',
			description,
			title: title || 'Error',
			duration,
		}),

	info: (description: string, title?: string, duration?: number) =>
		toastManager.add({
			type: 'info',
			description,
			title: title || 'Info',
			duration,
		}),

	warning: (description: string, title?: string, duration?: number) =>
		toastManager.add({
			type: 'warning',
			description,
			title: title || 'Warning',
			duration,
		}),

	custom: (toast: Omit<ToastInstance, 'id'>) => toastManager.add(toast),

	dismiss: (id: string) => toastManager.remove(id),

	clear: () => toastManager.clear(),
};

// ================================================================================================
// React Hook for Global Toast Manager
// ================================================================================================

export { toastManager };
