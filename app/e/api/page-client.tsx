'use client';

import { ApiContracts } from '@/components/developers/api/api-contracts';
import { ApiGetStarted } from '@/components/developers/api/api-get-started';
import { ApiHero } from '@/components/developers/api/api-hero';
import { ApiSurfaces } from '@/components/developers/api/api-surfaces';
import { ApiUseCases } from '@/components/developers/api/api-use-cases';
import { EndpointExplorer } from '@/components/developers/api/endpoint-explorer';
import { useTopBar } from '@/lib/stores/topbar-store';
import { useEffect } from 'react';

const API_PATHNAME = '/e/api';

export default function ApiPageClient() {
  const { applyRouteConfig, setTopBarForRoute, clearRoute } = useTopBar();

  useEffect(() => {
    applyRouteConfig(API_PATHNAME);

    setTopBarForRoute(API_PATHNAME, {
      title: 'API',
      subtitle: '',
      leftMode: 'menu',
      centerMode: 'title',
      showAvatar: true,
      desktopHidden: true,
      isOverlaid: false,
      buttons: [],
      badge: undefined,
    });

    return () => {
      clearRoute(API_PATHNAME);
    };
  }, [applyRouteConfig, setTopBarForRoute, clearRoute]);

  return (
    <div className='min-h-full w-full overflow-x-clip bg-white dark:bg-neutral-900'>
      <div className='mx-auto w-full max-w-7xl space-y-20 px-4 pb-40 pt-8 md:space-y-28 md:px-8 md:pb-20 md:pt-14'>
        <ApiHero />
        <ApiSurfaces />
        <EndpointExplorer />
        <ApiUseCases />
        <ApiContracts />
        <ApiGetStarted />
      </div>
    </div>
  );
}
