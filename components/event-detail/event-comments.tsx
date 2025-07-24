'use client';

import CommentItem from '@/components/event-detail/comment-item';
import { UserAvatar } from '@/components/ui/user-avatar';
import { useAddComment } from '@/lib/hooks/useAddComment';
import { useAuth } from '@/lib/hooks/useAuth';
import { useEventComments } from '@/lib/hooks/useEventComments';
import { cn } from '@/lib/utils';
import { toast } from '@/lib/utils/toast';
import { Loader2, MessageCircle, SendHorizontal } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';

interface EventCommentsProps {
	eventId: string;
}

export default function EventComments({ eventId }: EventCommentsProps) {
	const { user } = useAuth();
	const router = useRouter();
	const { data: comments = [], isLoading, error } = useEventComments(eventId);
	const addCommentMutation = useAddComment();
	const [commentText, setCommentText] = useState('');
	const textareaRef = useRef<HTMLTextAreaElement>(null);
	// Track which comment has an open reply input
	const [activeReplyId, setActiveReplyId] = useState<string | null>(null);

	// Auto-grow textarea as content grows
	useEffect(() => {
		if (textareaRef.current) {
			textareaRef.current.style.height = 'auto';
			textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
		}
	}, [commentText]);

	const handleAddComment = async () => {
		if (!commentText.trim() || !user) return;

		// Store the comment text before clearing for better UX
		const message = commentText.trim();

		// Clear text immediately for better UX
		setCommentText('');

		try {
			await addCommentMutation.mutateAsync({
				event_id: eventId,
				message,
			});
		} catch (error) {
			console.error('Error adding comment:', error);

			// Show detailed error message
			const errorMessage =
				error instanceof Error ? error.message : 'Your comment was not saved. Please try again.';

			toast.error(errorMessage);
		}
	};

	const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
		// Submit on Ctrl+Enter or Cmd+Enter
		if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
			e.preventDefault();
			handleAddComment();
		}
	};

	if (isLoading) {
		return (
			<div className='flex items-center justify-center py-12'>
				<Loader2 className='h-8 w-8 animate-spin text-gray-400' />
			</div>
		);
	}

	if (error) {
		return (
			<div className='flex flex-col items-center justify-center py-12'>
				<MessageCircle className='mb-4 h-12 w-12 text-gray-300' />
				<h3 className='mb-2 text-lg font-medium text-gray-900'>Couldn't load comments</h3>
				<p className='text-center text-sm text-gray-500'>
					There was a problem loading comments. Please try again later.
				</p>
			</div>
		);
	}

	return (
		<div className='py-4'>
			{/* Comment input */}
			<div className='mb-8'>
				<div className='flex gap-3'>
					<div className='flex-shrink-0'>
						<UserAvatar
							user={{
								name: user?.name,
								username: user?.username,
								image: user?.image,
								verification_status: user?.verification_status,
							}}
							size='sm'
							onAvatarClick={() => router.push(`/u/${user?.username}`)}
						/>
					</div>
					<div className='relative flex flex-grow'>
						<textarea
							name='comment'
							ref={textareaRef}
							value={commentText}
							onChange={(e) => setCommentText(e.target.value)}
							onKeyDown={handleKeyDown}
							placeholder='Add a comment'
							className='min-h-[40px] w-full resize-none rounded-lg border border-gray-200 bg-white px-3 py-2 pr-10 text-sm outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500'
							disabled={!user}
							rows={1}
						/>
						<button
							className={cn(
								'absolute bottom-0 right-2 top-0 my-auto flex h-8 w-8 items-center justify-center rounded-full text-gray-400 transition-colors',
								commentText.trim()
									? 'text-red-500 hover:text-red-600'
									: 'cursor-default text-gray-300'
							)}
							onClick={handleAddComment}
							disabled={!commentText.trim() || !user}
						>
							<SendHorizontal className='h-5 w-5' />
						</button>
					</div>
				</div>
				{!user && <p className='mt-2 text-xs text-gray-500'>Please sign in to leave a comment.</p>}
			</div>

			{/* Comments list */}
			{comments.length > 0 ? (
				<div className='mt-6 space-y-4'>
					{comments.map((comment) => (
						<CommentItem
							key={comment.id}
							comment={comment}
							currentUser={user}
							eventId={eventId}
							activeReplyId={activeReplyId}
							setActiveReplyId={setActiveReplyId}
						/>
					))}
				</div>
			) : (
				<div className='flex flex-col items-center justify-center py-8'>
					<MessageCircle className='mb-4 h-12 w-12 text-gray-300' />
					<h3 className='mb-2 text-lg font-medium text-gray-900'>No Comments Yet</h3>
					<p className='text-center text-sm text-gray-500'>
						Be the first to leave a comment about this event.
					</p>
				</div>
			)}
		</div>
	);
}
