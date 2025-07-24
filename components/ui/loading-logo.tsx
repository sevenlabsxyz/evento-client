import { cn } from '@/lib/utils';
import Image from 'next/image';

interface LoadingLogoProps {
	className?: string;
	size?: 'sm' | 'md' | 'lg';
}

export const LoadingLogo = ({ size = 'md', className }: LoadingLogoProps) => {
	const width = size === 'sm' ? 24 : size === 'md' ? 32 : 48;
	const height = size === 'sm' ? 24 : size === 'md' ? 32 : 48;

	return (
		<div className={cn('flex animate-spin items-center justify-center', className)}>
			<Image src='/assets/img/evento-sublogo.svg' alt='Evento Logo' width={width} height={height} />
		</div>
	);
};
