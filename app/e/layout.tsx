'use client';

import { TopBar } from '@/components/top-bar';
import { useTopBar } from '@/lib/stores/topbar-store';
import { usePathname } from 'next/navigation';
import { useEffect } from 'react';

export default function EventoLayout({ children }: { children: React.ReactNode }) {
	const { isOverlaid, applyRouteConfig } = useTopBar();
	const pathname = usePathname();

	// Simply apply any existing route configuration
	useEffect(() => {
		applyRouteConfig(pathname);
	}, [pathname, applyRouteConfig]);

	return (
		<>
			<TopBar />
			<div className={isOverlaid ? '' : 'pt-16'}>{children}</div>
		</>
	);
}
