'use client';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { UserAvatar } from '@/components/ui/user-avatar';
import { useVerifyEventPassword } from '@/lib/hooks/use-verify-event-password';
import { PasswordProtectedEventResponse } from '@/lib/types/api';
import { getEventCoverDisplayUrl, isGif } from '@/lib/utils/image';
import { toast } from '@/lib/utils/toast';
import { AlertCircle, Eye, EyeOff, KeyRound, Loader2, Lock } from 'lucide-react';
import Image from 'next/image';
import { useState } from 'react';

interface EventPasswordGateProps {
  event: PasswordProtectedEventResponse;
  onAccessGranted: () => void;
}

export function EventPasswordGate({ event, onAccessGranted }: EventPasswordGateProps) {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const verifyPassword = useVerifyEventPassword();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!password.trim()) {
      setError('Please enter the event password');
      return;
    }

    verifyPassword.mutate(
      { eventId: event.id, password: password.trim() },
      {
        onSuccess: (isValid) => {
          if (isValid) {
            toast.success('Access granted!');
            onAccessGranted();
          } else {
            setError('Incorrect password. Please try again.');
          }
        },
        onError: (err) => {
          setError(err.message || 'Failed to verify password. Please try again.');
        },
      }
    );
  };

  // Get optimized cover URL with fallback handling
  const coverImageUrl =
    event.cover && isGif(event.cover) ? event.cover : getEventCoverDisplayUrl(event.cover, 'feed');

  const hosts = event.hosts ?? [];
  const primaryHost = hosts[0];
  const hostLabel = primaryHost
    ? hosts.length > 1
      ? `${primaryHost.name || `@${primaryHost.username}`} + ${hosts.length - 1} more`
      : primaryHost.name || `@${primaryHost.username}`
    : null;

  return (
    <div className='flex min-h-screen flex-col items-center justify-center bg-white p-4 dark:bg-neutral-900'>
      <div className='w-full max-w-sm overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-neutral-800 dark:bg-neutral-900'>
        {/* Event cover image */}
        {coverImageUrl && (
          <div className='relative aspect-[16/10] w-full bg-gray-100 dark:bg-neutral-800'>
            <Image
              src={coverImageUrl}
              alt={event.title}
              fill
              className='object-cover'
              sizes='(max-width: 384px) 100vw, 384px'
            />
            <div className='absolute left-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-gray-900 shadow-sm backdrop-blur dark:bg-neutral-900/90 dark:text-neutral-100'>
              <Lock className='h-4 w-4' />
            </div>
          </div>
        )}

        <div className='space-y-5 p-5'>
          <div className='space-y-1.5'>
            <p className='text-xs font-semibold uppercase tracking-wider text-red-600 dark:text-red-400'>
              Private event
            </p>
            <h1 className='text-2xl font-bold tracking-tight text-gray-900 dark:text-neutral-100'>
              {event.title}
            </h1>
            {primaryHost && hostLabel && (
              <div className='flex items-center gap-2 pt-1'>
                <UserAvatar
                  user={{
                    name: primaryHost.name,
                    username: primaryHost.username,
                    image: primaryHost.image || primaryHost.avatar,
                  }}
                  size='xs'
                />
                <p className='truncate text-sm text-gray-600 dark:text-neutral-400'>
                  Hosted by{' '}
                  <span className='font-medium text-gray-900 dark:text-neutral-100'>
                    {hostLabel}
                  </span>
                </p>
              </div>
            )}
            <p className='pt-1 text-sm text-gray-500 dark:text-neutral-500'>
              This event is password protected. Enter the password to view event details.
            </p>
          </div>

          {/* Error Alert */}
          {error && (
            <Alert
              variant='destructive'
              className='rounded-xl bg-red-50 leading-none dark:bg-red-950/40 dark:text-red-400 dark:[&>svg]:text-red-400'
            >
              <AlertCircle className='h-4 w-4' />
              <AlertDescription className='-mb-1 mt-0.5 dark:text-red-400'>
                {error}
              </AlertDescription>
            </Alert>
          )}

          {/* Password Form */}
          <form onSubmit={handleSubmit} className='space-y-3'>
            <div className='space-y-2'>
              <label
                htmlFor='password'
                className='text-sm font-medium text-gray-900 dark:text-neutral-100'
              >
                Event Password
              </label>
              <div className='relative'>
                <KeyRound className='absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400 dark:text-neutral-500' />
                <Input
                  id='password'
                  type={showPassword ? 'text' : 'password'}
                  placeholder='Enter password'
                  className='h-11 rounded-xl border-gray-200 bg-gray-50 pl-10 pr-10 dark:border-neutral-800 dark:bg-neutral-800'
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={verifyPassword.isPending}
                />
                <button
                  type='button'
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  className='absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:text-neutral-500 dark:hover:text-neutral-300'
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className='h-4 w-4' /> : <Eye className='h-4 w-4' />}
                </button>
              </div>
            </div>

            <Button
              type='submit'
              className='h-11 w-full rounded-xl text-base'
              disabled={verifyPassword.isPending}
            >
              {verifyPassword.isPending ? (
                <>
                  <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                  Verifying...
                </>
              ) : (
                'Enter Event'
              )}
            </Button>
          </form>
        </div>
      </div>

      <p className='mx-auto my-4 w-full max-w-xs text-center text-xs text-gray-500 dark:text-neutral-500'>
        You&apos;ve been invited to an evento. Enter the password to access event details.
      </p>
    </div>
  );
}
