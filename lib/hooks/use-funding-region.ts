'use client';

import {
  detectFundingRegion,
  FundingRegion,
  isCashAppFundingRegion,
} from '@/lib/utils/funding-region';
import { logger } from '@/lib/utils/logger';
import { useEffect, useMemo, useState } from 'react';

export function useFundingRegion() {
  const [region, setRegion] = useState<FundingRegion | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function detect() {
      try {
        setIsLoading(true);
        const detectedRegion = await detectFundingRegion();
        if (isMounted) {
          setRegion(detectedRegion);
        }
      } catch (error) {
        logger.warn('Failed to detect funding region', {
          error: error instanceof Error ? error.message : String(error),
        });
        if (isMounted) {
          setRegion({
            country: 'unknown',
            countryCode: null,
            confidence: 'low',
            signals: [],
          });
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    detect();

    return () => {
      isMounted = false;
    };
  }, []);

  const isCashAppEligible = useMemo(() => isCashAppFundingRegion(region), [region]);

  return {
    isCashAppEligible,
    isLoading,
    region,
  };
}
