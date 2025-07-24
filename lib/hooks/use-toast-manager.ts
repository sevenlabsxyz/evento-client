'use client';
import { toastManager } from '@/lib/utils/toast';
import { useEffect, useState } from 'react';

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
