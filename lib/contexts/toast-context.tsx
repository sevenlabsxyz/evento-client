'use client';
import { SilkToast, type ToastType } from '@/components/ui/silk-toast';
import { SheetStack } from '@silk-hq/components';
import React, { createContext, useCallback, useContext, useRef, useState } from 'react';

// ================================================================================================
// Types
// ================================================================================================

export interface ToastData {
	id: string;
	type: ToastType;
	title?: string;
	description: string;
	duration?: number;
}

interface ToastContextValue {
	toasts: ToastData[];
	addToast: (toast: Omit<ToastData, 'id'>) => string;
	removeToast: (id: string) => void;
	clearToasts: () => void;
}

// ================================================================================================
// Context
// ================================================================================================

const ToastContext = createContext<ToastContextValue | null>(null);

// ================================================================================================
// Provider
// ================================================================================================

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
	const [toasts, setToasts] = useState<ToastData[]>([]);
	const toastIdCounter = useRef(0);

	const addToast = useCallback((toast: Omit<ToastData, 'id'>) => {
		const id = `toast-${toastIdCounter.current++}`;
		const newToast: ToastData = {
			id,
			...toast,
			duration: toast.duration ?? 5000,
		};

		setToasts((prev) => [...prev, newToast]);
		return id;
	}, []);

	const removeToast = useCallback((id: string) => {
		setToasts((prev) => prev.filter((toast) => toast.id !== id));
	}, []);

	const clearToasts = useCallback(() => {
		setToasts([]);
	}, []);

	return (
		<ToastContext.Provider
			value={{
				toasts,
				addToast,
				removeToast,
				clearToasts,
			}}
		>
			{children}
			<ToastContainer toasts={toasts} onDismiss={removeToast} />
		</ToastContext.Provider>
	);
};

// ================================================================================================
// Toast Container with Stacking
// ================================================================================================

interface ToastContainerProps {
	toasts: ToastData[];
	onDismiss: (id: string) => void;
}

const ToastContainer: React.FC<ToastContainerProps> = ({ toasts, onDismiss }) => {
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
					onDismiss={() => onDismiss(toast.id)}
				/>
			))}
		</SheetStack.Root>
	);
};

// ================================================================================================
// Hook
// ================================================================================================

export const useToast = () => {
	const context = useContext(ToastContext);
	if (!context) {
		throw new Error('useToast must be used within a ToastProvider');
	}
	return context;
};

// ================================================================================================
// Utility Functions
// ================================================================================================

export const createToastApi = (addToast: ToastContextValue['addToast']) => ({
	success: (description: string, title?: string, duration?: number) =>
		addToast({ type: 'success', description, title, duration }),

	error: (description: string, title?: string, duration?: number) =>
		addToast({ type: 'error', description, title, duration }),

	info: (description: string, title?: string, duration?: number) =>
		addToast({ type: 'info', description, title, duration }),

	warning: (description: string, title?: string, duration?: number) =>
		addToast({ type: 'warning', description, title, duration }),

	custom: (toast: Omit<ToastData, 'id'>) => addToast(toast),
});
