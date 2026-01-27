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
import { useApiKeys, useApiKeysCount } from '@/lib/hooks/use-api-keys';
import { useRequireAuth } from '@/lib/hooks/use-auth';
import { useTopBar } from '@/lib/stores/topbar-store';
import type { ApiKey } from '@/lib/types/api-key.types';
import { formatDistanceToNow } from 'date-fns';
import { AlertCircle, Key, Plus, ShieldAlert } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function ApiKeysPage() {
  const { isLoading: isCheckingAuth } = useRequireAuth();
  const { setTopBarForRoute, applyRouteConfig, clearRoute } = useTopBar();
  const pathname = usePathname();

  const { data: apiKeys = [], isLoading: isLoadingKeys } = useApiKeys();
  const { activeCount, maxKeys, canCreateMore } = useApiKeysCount();

  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [revokeDialogOpen, setRevokeDialogOpen] = useState(false);
  const [selectedKey, setSelectedKey] = useState<{ id: string; name: string } | null>(null);

  // Set TopBar content
  useEffect(() => {
    applyRouteConfig(pathname);

    setTopBarForRoute(pathname, {
      title: 'API Keys',
      subtitle: undefined,
      showAvatar: false,
      leftMode: 'back',
      centerMode: 'title',
    });

    return () => {
      clearRoute(pathname);
    };
  }, [pathname, setTopBarForRoute, applyRouteConfig, clearRoute]);

  const handleRevoke = (key: ApiKey) => {
    setSelectedKey({ id: key.id, name: key.name });
    setRevokeDialogOpen(true);
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Never';

    try {
      return formatDistanceToNow(new Date(dateString), { addSuffix: true });
    } catch {
      return 'Invalid date';
    }
  };

  if (isCheckingAuth || isLoadingKeys) {
    return (
      <div className='mx-auto flex min-h-screen max-w-full flex-col bg-white md:max-w-md'>
        <div className='flex-1 overflow-y-auto bg-white px-4 pt-4'>
          {/* Header Skeleton */}
          <div className='mb-6'>
            <Skeleton className='mb-2 h-6 w-48' />
            <Skeleton className='h-4 w-64' />
          </div>

          {/* Cards Skeleton */}
          <div className='space-y-4'>
            {[1, 2].map((i) => (
              <div key={i} className='rounded-2xl border border-gray-200 bg-gray-50 p-4'>
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
    <div className='mx-auto flex min-h-screen max-w-full flex-col bg-white md:max-w-md'>
      <div className='flex-1 overflow-y-auto bg-white px-4 pb-24 pt-4'>
        {/* Header */}
        <div className='mb-6'>
          <div className='mb-2 flex items-start justify-between'>
            <div>
              <h1 className='text-2xl font-bold text-gray-900'>API Keys</h1>
              <p className='mt-1 text-sm text-gray-600'>
                Manage your API keys for Evento integrations
              </p>
            </div>
          </div>

          {/* Key count indicator */}
          <div className='mt-4 flex items-stretch gap-2'>
            <div className='flex flex-1 items-center rounded-lg bg-gray-100 px-3'>
              <p className='text-xs text-gray-600'>
                Active Keys: <span className='font-semibold text-gray-900'>{activeCount}</span> /{' '}
                {maxKeys}
              </p>
            </div>
            <Button
              onClick={() => setCreateDialogOpen(true)}
              disabled={!canCreateMore}
              className='rounded-xl bg-red-500 hover:bg-red-600 disabled:bg-gray-300 disabled:text-gray-500'
            >
              <Plus className='mr-1 h-4 w-4' />
              Create Key
            </Button>
          </div>

          {!canCreateMore && (
            <div className='mt-3 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3'>
              <AlertCircle className='mt-0.5 h-4 w-4 flex-shrink-0 text-red-600' />
              <p className='text-sm text-red-800'>
                You&apos;ve reached the maximum of {maxKeys} API keys. Revoke an existing key to
                create a new one.
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
              <EmptyTitle>No API Keys</EmptyTitle>
              <EmptyDescription>
                Create your first API key to start integrating with Evento
              </EmptyDescription>
            </EmptyHeader>
            <EmptyContent>
              <Button
                onClick={() => setCreateDialogOpen(true)}
                className='bg-red-500 hover:bg-red-600'
              >
                <Plus className='mr-2 h-4 w-4' />
                Create Your First Key
              </Button>
            </EmptyContent>
          </Empty>
        ) : (
          <div className='space-y-4'>
            {apiKeys.map((key) => (
              <div
                key={key.id}
                className='rounded-2xl border border-gray-200 bg-gray-50 p-4 transition-shadow hover:shadow-md'
              >
                <div className='mb-3 flex items-start justify-between'>
                  <div className='flex items-center gap-2'>
                    <div className='flex h-8 w-8 items-center justify-center rounded-lg bg-red-100'>
                      {key.status === 'active' ? (
                        <Key className='h-4 w-4 text-red-600' />
                      ) : (
                        <ShieldAlert className='h-4 w-4 text-gray-600' />
                      )}
                    </div>
                    <h3 className='font-semibold text-gray-900'>{key.name}</h3>
                  </div>
                  <Badge
                    variant={key.status === 'active' ? 'default' : 'secondary'}
                    className={
                      key.status === 'active'
                        ? 'bg-green-100 text-green-800 hover:bg-green-100'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-200'
                    }
                  >
                    {key.status === 'active' ? 'Active' : 'Revoked'}
                  </Badge>
                </div>

                <div className='mb-3 space-y-1 text-sm text-gray-600'>
                  <div className='flex items-center justify-between'>
                    <span>Created:</span>
                    <span className='font-medium text-gray-900'>{formatDate(key.created_at)}</span>
                  </div>
                  <div className='flex items-center justify-between'>
                    <span>Last used:</span>
                    <span className='font-medium text-gray-900'>
                      {formatDate(key.last_used_at)}
                    </span>
                  </div>
                </div>

                {key.status === 'active' && (
                  <Button
                    variant='outline'
                    size='sm'
                    onClick={() => handleRevoke(key)}
                    className='w-full border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700'
                  >
                    Revoke Key
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
