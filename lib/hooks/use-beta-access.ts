'use client';

import { Env } from '@/lib/constants/env';
import { useEffect, useState } from 'react';

const BETA_ACCESS_KEY = 'evento-beta-access';

export function useBetaAccess() {
  const [hasAccess, setHasAccess] = useState<boolean | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem(BETA_ACCESS_KEY);
    setHasAccess(stored === 'granted');
  }, []);

  const grantAccess = () => {
    localStorage.setItem(BETA_ACCESS_KEY, 'granted');
    setHasAccess(true);
  };

  const revokeAccess = () => {
    localStorage.removeItem(BETA_ACCESS_KEY);
    setHasAccess(false);
  };

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
    isLoading: hasAccess === null,
    grantAccess,
    revokeAccess,
    validateCode,
  };
}
