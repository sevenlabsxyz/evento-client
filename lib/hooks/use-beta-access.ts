'use client';

import { Env } from '@/lib/constants/env';
import { useBetaAccessStore } from '@/lib/stores/beta-access-store';
import { useEffect } from 'react';

export function useBetaAccess() {
  const { hasAccess, isLoading, initialize, grantAccess, revokeAccess } = useBetaAccessStore();

  // Initialize on first hook usage
  useEffect(() => {
    if (hasAccess === null) {
      initialize();
    }
  }, [hasAccess, initialize]);

  const validateCode = (code: string): boolean => {
    const validCode = Env.NEXT_PUBLIC_BETA_ACCESS_CODE;
    if (!validCode) {
      // If no beta code is set, allow access (for development)
      return true;
    }
    return code === validCode;
  };

  return {
    hasAccess,
    isLoading,
    grantAccess,
    revokeAccess,
    validateCode,
  };
}
