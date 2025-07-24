'use client';

import { Button } from '@/components/ui/button';
import { useTopBar } from '@/lib/stores/topbar-store';
import { Bot, Mail, Twitter } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function HelpPage() {
	const { setTopBar } = useTopBar();

	// Set TopBar content
	useEffect(() => {
		setTopBar({
			title: 'Help',
			subtitle: 'Get support and find answers',
		});

		return () => {
			setTopBar({
				title: '',
				subtitle: '',
			});
		};
	}, [setTopBar]);

	const router = useRouter();

	const handleExternalLink = (url: string) => {
		window.open(url, '_blank', 'noopener,noreferrer');
	};

	return (
		<div className='mx-auto flex min-h-screen max-w-full flex-col bg-white md:max-w-sm'>
			{/* Header */}
			<div className='border-b border-gray-200'></div>

			{/* Content */}
			<div className='flex-1 space-y-4 overflow-y-auto bg-gray-50 px-4 py-6'>
				{/* AI Agent Card */}
				<div className='rounded-2xl border border-gray-200 bg-white p-6 transition-shadow hover:shadow-md'>
					<div className='mb-4 flex items-center gap-4'>
						<div className='flex h-12 w-12 items-center justify-center rounded-full bg-blue-100'>
							<Bot className='h-6 w-6 text-blue-600' />
						</div>
						<div>
							<h3 className='text-lg font-bold'>Talk to our AI agent</h3>
							<p className='text-sm text-gray-500'>Get instant answers to common questions</p>
						</div>
					</div>
					<Button className='w-full bg-blue-500 text-white hover:bg-blue-600'>Start Chat</Button>
				</div>

				{/* Twitter Card */}
				<div className='rounded-2xl border border-gray-200 bg-white p-6 transition-shadow hover:shadow-md'>
					<div className='mb-4 flex items-center gap-4'>
						<div className='flex h-12 w-12 items-center justify-center rounded-full bg-black'>
							<Twitter className='h-6 w-6 text-white' />
						</div>
						<div>
							<h3 className='text-lg font-bold'>Reach out to us on X</h3>
							<p className='text-sm text-gray-500'>Connect with us on social media</p>
						</div>
					</div>
					<Button
						className='w-full bg-black text-white hover:bg-gray-800'
						onClick={() => handleExternalLink('https://x.com/evento')}
					>
						Follow @evento
					</Button>
				</div>

				{/* Email Card */}
				<div className='rounded-2xl border border-gray-200 bg-white p-6 transition-shadow hover:shadow-md'>
					<div className='mb-4 flex items-center gap-4'>
						<div className='flex h-12 w-12 items-center justify-center rounded-full bg-red-100'>
							<Mail className='h-6 w-6 text-red-600' />
						</div>
						<div>
							<h3 className='text-lg font-bold'>Email us at evento.so</h3>
							<p className='text-sm text-gray-500'>Send us a detailed message</p>
						</div>
					</div>
					<Button
						className='w-full bg-red-500 text-white hover:bg-red-600'
						onClick={() => handleExternalLink('mailto:hello@evento.so')}
					>
						Send Email
					</Button>
				</div>
			</div>
		</div>
	);
}
