'use client';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { SheetWithDetent } from '@/components/ui/sheet-with-detent';
import { useUserFollowing } from '@/lib/hooks/useUserProfile';
import { VisuallyHidden } from '@silk-hq/components';
import { ArrowRight, MessageCircle } from 'lucide-react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';
import './FollowersSheet.css';

interface FollowingSheetProps {
	isOpen: boolean;
	onClose: () => void;
	userId: string;
	username: string;
}

export default function FollowingSheet({ isOpen, onClose, userId, username }: FollowingSheetProps) {
	const [activeDetent, setActiveDetent] = useState(0);
	const [searchText, setSearchText] = useState('');
	const router = useRouter();

	const { data: following, isLoading, error } = useUserFollowing(userId);

	// Filter following based on search query
	const filteredFollowing = useMemo(() => {
		if (!following) return [];
		if (!searchText.trim()) return following;

		const query = searchText.toLowerCase();
		return following.filter(
			(user) =>
				user.username?.toLowerCase().includes(query) || user.name?.toLowerCase().includes(query)
		);
	}, [following, searchText]);

	const handleUserClick = (username: string) => {
		router.push(`/${username}`);
		onClose();
	};

	const handleMessageClick = (userId: string) => {
		router.push(`/e/messages?user=${userId}`);
		onClose();
	};

	return (
		<SheetWithDetent.Root
			presented={isOpen}
			onPresentedChange={(presented) => !presented && onClose()}
			activeDetent={activeDetent}
			onActiveDetentChange={setActiveDetent}
		>
			<SheetWithDetent.Portal>
				<SheetWithDetent.View>
					<SheetWithDetent.Backdrop />
					<SheetWithDetent.Content className='FollowersSheet-content'>
						<div className='FollowersSheet-header'>
							<SheetWithDetent.Handle className='FollowersSheet-handle' />
							<VisuallyHidden.Root asChild>
								<SheetWithDetent.Title className='FollowersSheet-title'>
									Following
								</SheetWithDetent.Title>
							</VisuallyHidden.Root>
							<input
								className='FollowersSheet-input'
								type='text'
								placeholder='Search following'
								value={searchText}
								onChange={(e) => setSearchText(e.target.value)}
								onFocus={() => setActiveDetent(2)}
							/>
						</div>
						<SheetWithDetent.ScrollRoot asChild>
							<SheetWithDetent.ScrollView className='FollowersSheet-scrollView'>
								<SheetWithDetent.ScrollContent className='FollowersSheet-scrollContent'>
									{isLoading ? (
										// Loading State
										Array.from({ length: 3 }).map((_, index) => (
											<div key={`loading-${index}`} className='FollowersSheet-loadingContainer'>
												<div className='FollowersSheet-loadingAvatar' />
												<div className='FollowersSheet-loadingDetails'>
													<div className='FollowersSheet-loadingLine' />
													<div className='FollowersSheet-loadingLine FollowersSheet-loadingLine--short' />
												</div>
											</div>
										))
									) : error ? (
										// Error State
										<div className='FollowersSheet-errorContainer'>
											<div className='FollowersSheet-errorText'>Failed to load following</div>
										</div>
									) : filteredFollowing.length === 0 ? (
										// Empty State
										<div className='FollowersSheet-emptyContainer'>
											<div className='FollowersSheet-emptyText'>
												{searchText.trim()
													? `No following found matching "${searchText}"`
													: `@${username} is not following anyone yet`}
											</div>
										</div>
									) : (
										// Following List
										filteredFollowing.map((user, index) => (
											<div
												key={user.id || `following-${index}`}
												className='FollowersSheet-userContainer'
											>
												<button
													onClick={() => handleUserClick(user.username)}
													className='FollowersSheet-userButton'
												>
													<Avatar className='FollowersSheet-userAvatar'>
														<AvatarImage src={user.image || ''} alt={user.name || user.username} />
														<AvatarFallback>
															<Image
																src='/assets/img/evento-sublogo.svg'
																alt='Evento'
																width={32}
																height={32}
															/>
														</AvatarFallback>
													</Avatar>
													<div className='FollowersSheet-userDetails'>
														<div className='FollowersSheet-userInfo'>
															<div className='FollowersSheet-username'>@{user.username}</div>
															{user.verification_status === 'verified' && (
																<div className='FollowersSheet-verified'>✓</div>
															)}
														</div>
														<div className='FollowersSheet-name'>{user.name || user.username}</div>
													</div>
												</button>
												<div className='FollowersSheet-actions'>
													<Button
														variant='ghost'
														size='icon'
														className='FollowersSheet-actionButton'
														onClick={() => handleMessageClick(user.id)}
													>
														<MessageCircle className='FollowersSheet-actionIcon' />
													</Button>
													<Button
														variant='ghost'
														size='icon'
														className='FollowersSheet-actionButton'
														onClick={() => handleUserClick(user.username)}
													>
														<ArrowRight className='FollowersSheet-actionIcon' />
													</Button>
												</div>
											</div>
										))
									)}
								</SheetWithDetent.ScrollContent>
							</SheetWithDetent.ScrollView>
						</SheetWithDetent.ScrollRoot>
					</SheetWithDetent.Content>
				</SheetWithDetent.View>
			</SheetWithDetent.Portal>
		</SheetWithDetent.Root>
	);
}
