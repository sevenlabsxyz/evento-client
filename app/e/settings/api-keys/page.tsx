'use client';

import { CreateApiKeyDialog } from '@/components/settings/create-api-key-dialog';
import { RevokeApiKeyDialog } from '@/components/settings/revoke-api-key-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty';
import { Skeleton } from '@/components/ui/skeleton';
import { isAppLocale } from '@/i18n/config';
import { useApiKeys, useApiKeysCount } from '@/lib/hooks/use-api-keys';
import { useRequireAuth } from '@/lib/hooks/use-auth';
import { useTopBar } from '@/lib/stores/topbar-store';
import type { ApiKey } from '@/lib/types/api-key.types';
import { formatDistanceToNow } from 'date-fns';
import { enUS, es, ptBR } from 'date-fns/locale';
import { AlertCircle, Key, Plus, ShieldAlert } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';

const DATE_FNS_LOCALES = { en: enUS, 'pt-BR': ptBR, es } as const;

export default function ApiKeysPage() {
  const t = useTranslations('settings');
  const locale = useLocale();
  const dateFnsLocale = isAppLocale(locale) ? DATE_FNS_LOCALES[locale] : enUS;
  const { isLoading: isCheckingAuth } = useRequireAuth();
  const { setTopBarForRoute, applyRouteConfig, clearRoute } = useTopBar();
  const pathname = usePathname();

  const { data: apiKeys = [], isLoading: isLoadingKeys } = useApiKeys();
  const { activeCount, maxKeys, canCreateMore } = useApiKeysCount();

  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [revokeDialogOpen, setRevokeDialogOpen] = useState(false);
  const [selectedKey, setSelectedKey] = useState<{ id: string; name: string } | null>(null);

  const topBarTitle = t('apiKeys.title');

  // Set TopBar content
  useEffect(() => {
    applyRouteConfig(pathname);

    setTopBarForRoute(pathname, {
      title: topBarTitle,
      subtitle: undefined,
      showAvatar: false,
      leftMode: 'back',
      centerMode: 'title',
    });

    return () => {
      clearRoute(pathname);
    };
  }, [pathname, topBarTitle, setTopBarForRoute, applyRouteConfig, clearRoute]);

  const handleRevoke = (key: ApiKey) => {
    setSelectedKey({ id: key.id, name: key.name });
    setRevokeDialogOpen(true);
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return t('apiKeys.never');

    try {
      return formatDistanceToNow(new Date(dateString), {
        addSuffix: true,
        locale: dateFnsLocale,
      });
    } catch {
      return t('apiKeys.invalidDate');
    }
  };

  if (isCheckingAuth || isLoadingKeys) {
    return (
      <div className='mx-auto flex min-h-screen max-w-full flex-col bg-white dark:bg-neutral-900 md:max-w-md'>
        <div className='flex-1 overflow-y-auto bg-white px-4 pt-4 dark:bg-neutral-900'>
          {/* Header Skeleton */}
          <div className='mb-6'>
            <Skeleton className='mb-2 h-6 w-48' />
            <Skeleton className='h-4 w-64' />
          </div>

          {/* Cards Skeleton */}
          <div className='space-y-4'>
            {[1, 2].map((i) => (
              <div
                key={i}
                className='rounded-2xl border border-gray-200 bg-gray-50 p-4 dark:border-neutral-800 dark:bg-neutral-950'
              >
                <div className='mb-3 flex items-start justify-between'>
                  <Skeleton className='h-5 w-40' />
                  <Skeleton className='h-5 w-16' />
                </div>
                <div className='space-y-2'>
                  <Skeleton className='h-4 w-32' />
                  <Skeleton className='h-4 w-28' />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className='mx-auto flex min-h-screen max-w-full flex-col bg-white dark:bg-neutral-900 md:max-w-md'>
      <div className='flex-1 overflow-y-auto bg-white px-4 pb-24 pt-4 dark:bg-neutral-900'>
        {/* Header */}
        <div className='mb-6'>
          <div className='mb-2 flex items-start justify-between'>
            <div>
              <h1 className='text-2xl font-bold text-gray-900 dark:text-neutral-100'>
                {t('apiKeys.title')}
              </h1>
              <p className='mt-1 text-sm text-gray-600 dark:text-neutral-400'>
                {t('apiKeys.description')}
              </p>
            </div>
          </div>

          {/* Key count indicator */}
          <div className='mt-4 flex items-stretch gap-2'>
            <div className='flex flex-1 items-center rounded-lg bg-gray-100 px-3 dark:bg-neutral-800'>
              <p className='text-xs text-gray-600 dark:text-neutral-400'>
                {t.rich('apiKeys.activeCount', {
                  count: activeCount,
                  max: maxKeys,
                  strong: (chunks) => (
                    <span className='font-semibold text-gray-900 dark:text-neutral-100'>
                      {chunks}
                    </span>
                  ),
                })}
              </p>
            </div>
            <Button
              onClick={() => setCreateDialogOpen(true)}
              disabled={!canCreateMore}
              className='rounded-xl bg-red-500 text-white hover:bg-red-600 disabled:bg-gray-300 disabled:text-gray-500 dark:bg-red-600 dark:text-white dark:hover:bg-red-700 dark:disabled:bg-neutral-600 dark:disabled:text-neutral-400'
            >
              <Plus className='mr-1 h-4 w-4' />
              {t('apiKeys.createKey')}
            </Button>
          </div>

          {!canCreateMore && (
            <div className='mt-3 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 dark:border-red-900 dark:bg-red-950/40'>
              <AlertCircle className='mt-0.5 h-4 w-4 flex-shrink-0 text-red-600 dark:text-red-400' />
              <p className='text-sm text-red-800 dark:text-red-400'>
                {t('apiKeys.limitReached', { max: maxKeys })}
              </p>
            </div>
          )}
        </div>

        {/* API Keys List */}
        {apiKeys.length === 0 ? (
          <Empty>
            <EmptyHeader>
              <EmptyMedia variant='icon'>
                <Key className='h-6 w-6' />
              </EmptyMedia>
              <EmptyTitle>{t('apiKeys.emptyTitle')}</EmptyTitle>
              <EmptyDescription>{t('apiKeys.emptyDescription')}</EmptyDescription>
            </EmptyHeader>
            <EmptyContent>
              <Button
                onClick={() => setCreateDialogOpen(true)}
                className='bg-red-500 text-white hover:bg-red-600 dark:bg-red-600 dark:hover:bg-red-700'
              >
                <Plus className='mr-2 h-4 w-4' />
                {t('apiKeys.createFirstKey')}
              </Button>
            </EmptyContent>
          </Empty>
        ) : (
          <div className='space-y-4'>
            {apiKeys.map((key) => (
              <div
                key={key.id}
                className='rounded-2xl border border-gray-200 bg-gray-50 p-4 transition-shadow hover:shadow-md dark:border-neutral-800 dark:bg-neutral-950'
              >
                <div className='mb-3 flex items-start justify-between'>
                  <div className='flex items-center gap-2'>
                    <div className='flex h-8 w-8 items-center justify-center rounded-lg bg-red-100 dark:bg-red-950/60'>
                      {key.status === 'active' ? (
                        <Key className='h-4 w-4 text-red-600 dark:text-red-400' />
                      ) : (
                        <ShieldAlert className='h-4 w-4 text-gray-600 dark:text-neutral-400' />
                      )}
                    </div>
                    <h3 className='font-semibold text-gray-900 dark:text-neutral-100'>
                      {key.name}
                    </h3>
                  </div>
                  <Badge
                    variant={key.status === 'active' ? 'default' : 'secondary'}
                    className={
                      key.status === 'active'
                        ? 'bg-green-100 text-green-800 hover:bg-green-100 dark:bg-green-950/60 dark:text-green-400 dark:hover:bg-green-950/60'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-200 dark:bg-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-700'
                    }
                  >
                    {key.status === 'active'
                      ? t('apiKeys.statusActive')
                      : t('apiKeys.statusRevoked')}
                  </Badge>
                </div>

                <div className='mb-3 space-y-1 text-sm text-gray-600 dark:text-neutral-400'>
                  <div className='flex items-center justify-between'>
                    <span>{t('apiKeys.created')}</span>
                    <span className='font-medium text-gray-900 dark:text-neutral-100'>
                      {formatDate(key.created_at)}
                    </span>
                  </div>
                  <div className='flex items-center justify-between'>
                    <span>{t('apiKeys.lastUsed')}</span>
                    <span className='font-medium text-gray-900 dark:text-neutral-100'>
                      {formatDate(key.last_used_at)}
                    </span>
                  </div>
                </div>

                {key.status === 'active' && (
                  <Button
                    variant='outline'
                    size='sm'
                    onClick={() => handleRevoke(key)}
                    className='w-full border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 dark:border-red-900 dark:text-red-400 dark:hover:bg-red-950/40 dark:hover:text-red-400'
                  >
                    {t('apiKeys.revokeKey')}
                  </Button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Dialogs */}
      <CreateApiKeyDialog open={createDialogOpen} onOpenChange={setCreateDialogOpen} />
      <RevokeApiKeyDialog
        open={revokeDialogOpen}
        onOpenChange={setRevokeDialogOpen}
        apiKeyId={selectedKey?.id || null}
        apiKeyName={selectedKey?.name || null}
      />
    </div>
  );
}
