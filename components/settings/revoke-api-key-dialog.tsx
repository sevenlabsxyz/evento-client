'use client';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useRevokeApiKey } from '@/lib/hooks/use-api-keys';
import { toast } from '@/lib/utils/toast';

interface RevokeApiKeyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  apiKeyId: string | null;
  apiKeyName: string | null;
}

export function RevokeApiKeyDialog({
  open,
  onOpenChange,
  apiKeyId,
  apiKeyName,
}: RevokeApiKeyDialogProps) {
  const revokeApiKey = useRevokeApiKey();

  const handleRevoke = async () => {
    if (!apiKeyId) return;

    try {
      await revokeApiKey.mutateAsync(apiKeyId);
      toast.success('API key revoked successfully');
      onOpenChange(false);
    } catch (error) {
      if (error instanceof Error) {
        toast.error(error.message);
      } else {
        toast.error('Failed to revoke API key');
      }
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Revoke API Key</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to revoke &quot;{apiKeyName}&quot;? This action cannot be undone
            and any applications using this key will immediately lose access.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={revokeApiKey.isPending}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleRevoke}
            disabled={revokeApiKey.isPending}
            className='bg-red-600 hover:bg-red-700 focus:ring-red-600'
          >
            {revokeApiKey.isPending ? 'Revoking...' : 'Revoke Key'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
