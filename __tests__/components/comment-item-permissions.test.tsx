import { render, screen } from '@testing-library/react';

import CommentItem from '@/components/event-detail/comment-item';

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: jest.fn() }),
}));

jest.mock('@/components/circled-icon-button', () => ({
  CircledIconButton: ({ onClick }: { onClick: () => void }) => (
    <button type='button' aria-label='Comment actions' onClick={onClick} />
  ),
}));

jest.mock('@/components/comment-reaction-button', () => ({
  CommentReactionButton: () => <button type='button'>Reaction</button>,
}));

jest.mock('@/components/event-detail/delete-confirmation-sheet', () => ({
  __esModule: true,
  default: () => null,
}));

jest.mock('@/components/ui/button', () => ({
  Button: ({ children, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) => (
    <button {...props}>{children}</button>
  ),
}));

jest.mock('@/components/ui/user-avatar', () => ({
  UserAvatar: () => <div>User avatar</div>,
}));

jest.mock('@/components/ui/quick-profile-sheet', () => ({
  __esModule: true,
  default: () => null,
}));

jest.mock('@/components/ui/reply-avatar', () => ({
  ReplyAvatar: () => <div>Reply avatar</div>,
}));

jest.mock('@/components/zap/zap-sheet', () => ({
  ZapSheet: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

jest.mock('@/components/event-detail/comment-actions-sheet', () => ({
  CommentActionsSheet: ({ canEdit, canDelete }: { canEdit: boolean; canDelete: boolean }) => (
    <div
      data-testid='comment-action-permissions'
      data-can-edit={String(canEdit)}
      data-can-delete={String(canDelete)}
    />
  ),
}));

jest.mock('@/lib/hooks/use-add-comment', () => ({
  useAddComment: () => ({ mutateAsync: jest.fn() }),
}));

jest.mock('@/lib/hooks/use-comment-reactions', () => ({
  useCommentReactions: () => ({
    reactions: { like: 0 },
    userReaction: null,
    toggleReaction: jest.fn(),
    isToggling: false,
  }),
}));

jest.mock('@/lib/hooks/use-delete-comment', () => ({
  useDeleteComment: () => ({ mutateAsync: jest.fn(), isPending: false }),
}));

jest.mock('@/lib/hooks/use-edit-comment', () => ({
  useEditComment: () => ({ mutateAsync: jest.fn() }),
}));

const comment = {
  id: 'comment-1',
  event_id: 'event-1',
  user_id: 'author-1',
  message: 'A comment',
  created_at: '2026-07-14T12:00:00.000Z',
  updated_at: '2026-07-14T12:00:00.000Z',
  user_details: {
    id: 'author-1',
    username: 'author',
    name: 'Author',
    bio: '',
    image: '',
    verification_status: 'unverified',
  },
  replies: [],
};

const renderComment = ({
  currentUserId,
  isEventHost = false,
}: {
  currentUserId: string;
  isEventHost?: boolean;
}) =>
  render(
    <CommentItem
      comment={comment as any}
      currentUser={
        {
          ...comment.user_details,
          id: currentUserId,
          username: currentUserId,
        } as any
      }
      eventId='event-1'
      isEventHost={isEventHost}
      activeReplyId={null}
      setActiveReplyId={jest.fn()}
    />
  );

describe('CommentItem permissions', () => {
  it('lets the author edit and delete', () => {
    renderComment({ currentUserId: 'author-1' });

    expect(screen.getByRole('button', { name: 'Comment actions' })).toBeInTheDocument();
    expect(screen.getByTestId('comment-action-permissions')).toHaveAttribute(
      'data-can-edit',
      'true'
    );
    expect(screen.getByTestId('comment-action-permissions')).toHaveAttribute(
      'data-can-delete',
      'true'
    );
  });

  it('lets an event host delete another user comment without editing it', () => {
    renderComment({ currentUserId: 'host-1', isEventHost: true });

    expect(screen.getByRole('button', { name: 'Comment actions' })).toBeInTheDocument();
    expect(screen.getByTestId('comment-action-permissions')).toHaveAttribute(
      'data-can-edit',
      'false'
    );
    expect(screen.getByTestId('comment-action-permissions')).toHaveAttribute(
      'data-can-delete',
      'true'
    );
  });

  it('shows no moderation action to a nonhost who is not the author', () => {
    renderComment({ currentUserId: 'viewer-1' });

    expect(screen.queryByRole('button', { name: 'Comment actions' })).not.toBeInTheDocument();
    expect(screen.getByTestId('comment-action-permissions')).toHaveAttribute(
      'data-can-edit',
      'false'
    );
    expect(screen.getByTestId('comment-action-permissions')).toHaveAttribute(
      'data-can-delete',
      'false'
    );
  });
});
