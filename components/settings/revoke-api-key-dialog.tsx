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
import { useTranslations } from 'next-intl';

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
  const t = useTranslations('settings');
  const tCommon = useTranslations('common');
  const revokeApiKey = useRevokeApiKey();

  const handleRevoke = async () => {
    if (!apiKeyId) return;

    try {
      await revokeApiKey.mutateAsync(apiKeyId);
      toast.success(t('revokeApiKey.success'));
      onOpenChange(false);
    } catch (error) {
      if (error instanceof Error) {
        toast.error(error.message);
      } else {
        toast.error(t('revokeApiKey.failed'));
      }
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t('revokeApiKey.title')}</AlertDialogTitle>
          <AlertDialogDescription>
            {t('revokeApiKey.description', { name: apiKeyName ?? '' })}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={revokeApiKey.isPending}>
            {tCommon('actions.cancel')}
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleRevoke}
            disabled={revokeApiKey.isPending}
            className='bg-red-600 hover:bg-red-700 focus:ring-red-600'
          >
            {revokeApiKey.isPending ? t('revokeApiKey.revoking') : t('revokeApiKey.confirm')}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
