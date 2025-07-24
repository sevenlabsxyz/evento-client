'use client';

import { BitcoinSVGIcon } from '@/components/icons/bitcoin';
import { Globe, Instagram } from 'lucide-react';
import { useState } from 'react';
import InstagramSheet from './sheets/instagram-sheet';
import LightningSheet from './sheets/lightning-sheet';
import NostrSheet from './sheets/nostr-sheet';
import WebsiteSheet from './sheets/website-sheet';
import XSheet from './sheets/x-sheet';

interface User {
	bio_link?: string;
	instagram_handle?: string;
	x_handle?: string;
	ln_address?: string;
	nip05?: string;
}

interface SocialLinksProps {
	user: User;
}

export default function SocialLinks({ user }: SocialLinksProps) {
	const [activeSheet, setActiveSheet] = useState<string | null>(null);

	// Check if user has any social links
	const hasAnyLinks =
		user.bio_link || user.instagram_handle || user.x_handle || user.ln_address || user.nip05;

	if (!hasAnyLinks) {
		return null;
	}

	return (
		<>
			<div className='flex w-full max-w-md flex-wrap justify-center gap-2 rounded-2xl rounded-xl border border-gray-200 bg-gray-50 bg-white p-2.5 shadow-sm transition-all duration-200'>
				{/* Website */}
				{user.bio_link && (
					<button
						onClick={() => setActiveSheet('website')}
						className='flex items-center gap-1.5 rounded-full border border-gray-200 bg-gray-100 px-3 py-1.5 shadow-sm transition-colors hover:bg-gray-50'
					>
						<Globe className='h-5 w-5 text-gray-600' />
						{/* <span className='text-sm font-normal text-gray-900'>
              {getDomainFromUrl(user.bio_link)}
            </span> */}
					</button>
				)}

				{/* Instagram */}
				{user.instagram_handle && (
					<button
						onClick={() => setActiveSheet('instagram')}
						className='flex items-center gap-1.5 rounded-full border border-gray-200 bg-gray-100 px-3 py-1.5 shadow-sm transition-colors hover:bg-gray-50'
					>
						<Instagram className='h-5 w-5 text-pink-500' />
						{/* <span className='text-sm font-normal text-gray-900'>
              @{user.instagram_handle}
            </span> */}
					</button>
				)}

				{/* X/Twitter */}
				{user.x_handle && (
					<button
						onClick={() => setActiveSheet('x')}
						className='flex items-center gap-1.5 rounded-full border border-gray-200 bg-gray-100 px-3 py-1.5 shadow-sm transition-colors hover:bg-gray-50'
					>
						<svg className='h-5 w-5' viewBox='0 0 24 24' fill='currentColor'>
							<path d='M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z' />
						</svg>
						{/* <span className='text-sm font-normal text-gray-900'>
              @{user.x_handle}
            </span> */}
					</button>
				)}

				{/* Lightning */}
				{user.ln_address && (
					<button
						onClick={() => setActiveSheet('lightning')}
						className='flex items-center gap-1.5 rounded-full border border-gray-200 bg-gray-100 px-3 py-1.5 shadow-sm transition-colors hover:bg-gray-50'
					>
						<BitcoinSVGIcon className='h-5 w-5' fill='#f7931a' />
						{/* <span className='text-sm font-normal text-gray-900'>
              {user.ln_address.length > 20
                ? `${user.ln_address.substring(0, 20)}...`
                : user.ln_address}
            </span> */}
					</button>
				)}

				{/* Nostr */}
				{user.nip05 && (
					<button
						onClick={() => setActiveSheet('nostr')}
						className='flex items-center gap-1.5 rounded-full border border-gray-200 bg-gray-100 px-3 py-1.5 shadow-sm transition-colors hover:bg-gray-50'
					>
						<div className='flex h-5 w-5 items-center justify-center rounded-full bg-purple-500'>
							<span className='text-xs font-bold text-white'>N</span>
						</div>
						{/* <span className='text-sm font-normal text-gray-900'>
              {user.nip05.length > 20
                ? `${user.nip05.substring(0, 20)}...`
                : user.nip05}
            </span> */}
					</button>
				)}
			</div>

			{/* Detached Sheets */}
			<WebsiteSheet
				isOpen={activeSheet === 'website'}
				onClose={() => setActiveSheet(null)}
				url={user.bio_link || ''}
			/>

			<InstagramSheet
				isOpen={activeSheet === 'instagram'}
				onClose={() => setActiveSheet(null)}
				handle={user.instagram_handle || ''}
			/>

			<XSheet
				isOpen={activeSheet === 'x'}
				onClose={() => setActiveSheet(null)}
				handle={user.x_handle || ''}
			/>

			<LightningSheet
				isOpen={activeSheet === 'lightning'}
				onClose={() => setActiveSheet(null)}
				address={user.ln_address || ''}
			/>

			<NostrSheet
				isOpen={activeSheet === 'nostr'}
				onClose={() => setActiveSheet(null)}
				nip05={user.nip05 || ''}
			/>
		</>
	);
}
