import { useAuth } from '@/lib/hooks/use-auth';
import { useFollowAction } from '@/lib/hooks/use-user-profile';
import { useEnsureAuthenticatedAction } from '@/lib/providers/auth-recovery-provider';
import { toast } from '@/lib/utils/toast';
import { useCallback } from 'react';

interface UseProtectedFollowActionOptions {
  userId: string;
  userName?: string | null;
  isFollowing?: boolean;
}

export function useProtectedFollowAction({
  userId,
  userName,
  isFollowing = false,
}: UseProtectedFollowActionOptions) {
  const { user: loggedInUser } = useAuth();
  const ensureAuthenticatedAction = useEnsureAuthenticatedAction();
  const followActionMutation = useFollowAction();

  const handleFollowToggle = useCallback(async () => {
    const action = isFollowing ? 'unfollow' : 'follow';

    if (!userId) {
      toast.error('Unable to identify user');
      return;
    }

    if (!loggedInUser) {
      const recovered = await ensureAuthenticatedAction({
        reason: `action:${action}:user:${userId}`,
      });

      if (!recovered) {
        return;
      }
    }

    try {
      await followActionMutation.mutateAsync({ userId, action });
      if (action === 'follow') {
        toast.success(`You followed ${userName || 'this user'}!`);
      } else {
        toast.success(`You unfollowed ${userName || 'this user'}`);
      }
    } catch (error) {
      const status =
        error && typeof error === 'object' && 'status' in error
          ? (error as { status?: number }).status
          : undefined;

      if (status === 401) {
        await ensureAuthenticatedAction({ reason: `action:${action}:user:${userId}` });
        return;
      }

      toast.error(`Failed to ${action}. Please try again.`);
    }
  }, [ensureAuthenticatedAction, followActionMutation, isFollowing, loggedInUser, userId, userName]);

  return {
    handleFollowToggle,
    isPending: followActionMutation.isPending,
  };
}
