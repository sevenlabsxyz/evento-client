'use client';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useVerifyEventPassword } from '@/lib/hooks/use-verify-event-password';
import { PasswordProtectedEventResponse } from '@/lib/types/api';
import { toast } from '@/lib/utils/toast';
import { AlertCircle, Eye, EyeOff, KeyRound, Loader2 } from 'lucide-react';
import Image from 'next/image';
import { useState } from 'react';
import { ContactHostModal } from './contact-host-modal';

interface EventPasswordGateProps {
  event: PasswordProtectedEventResponse;
  onAccessGranted: () => void;
}

export function EventPasswordGate({ event, onAccessGranted }: EventPasswordGateProps) {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showContactModal, setShowContactModal] = useState(false);

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

  // Get primary host for display
  const primaryHost = event.hosts?.[0];

  return (
    <div className='flex min-h-screen flex-col items-center justify-center bg-white p-4'>
      <Card className='w-full max-w-sm rounded-3xl bg-gray-50'>
        <CardHeader className='space-y-4'>
          {/* Event cover image */}
          {event.cover && (
            <div className='relative mx-auto aspect-video w-full overflow-hidden rounded-2xl'>
              <Image
                src={event.cover}
                alt={event.title}
                fill
                className='object-cover'
                sizes='(max-width: 384px) 100vw, 384px'
              />
            </div>
          )}

          <div className='space-y-1'>
            <CardTitle className='text-center text-xl font-bold'>{event.title}</CardTitle>
            <CardDescription className='text-center'>
              This event is password protected. Enter the password to view event details.
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent className='space-y-4'>
          {/* Error Alert */}
          {error && (
            <Alert variant='destructive' className='bg-red-50 leading-none'>
              <AlertCircle className='h-4 w-4' />
              <AlertDescription className='-mb-1 mt-0.5'>{error}</AlertDescription>
            </Alert>
          )}

          {/* Password Form */}
          <form onSubmit={handleSubmit} className='space-y-4'>
            <div className='space-y-2'>
              <label htmlFor='password' className='text-sm font-medium'>
                Event Password
              </label>
              <div className='relative'>
                <KeyRound className='absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400' />
                <Input
                  id='password'
                  type={showPassword ? 'text' : 'password'}
                  placeholder='Enter password'
                  className='bg-white pl-10 pr-10'
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={verifyPassword.isPending}
                />
                <button
                  type='button'
                  className='absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600'
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className='h-4 w-4' /> : <Eye className='h-4 w-4' />}
                </button>
              </div>
            </div>

            <Button
              type='submit'
              className='w-full py-6 text-base'
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

          <div className='relative'>
            <div className='absolute inset-0 flex items-center'>
              <span className='w-full border-t' />
            </div>
            <div className='relative flex justify-center text-xs uppercase'>
              <span className='bg-gray-50 px-2 text-muted-foreground'>or</span>
            </div>
          </div>

          {/* Contact Host Button */}
          <Button
            variant='secondary'
            className='w-full border border-gray-200 bg-white py-6 text-base'
            onClick={() => setShowContactModal(true)}
            disabled={verifyPassword.isPending}
          >
            Contact Host
          </Button>
        </CardContent>
      </Card>

      <div className='mx-auto my-4 w-full max-w-xs text-center text-xs tracking-wide text-muted-foreground opacity-75'>
        <p>You&apos;ve been invited to an evento. Enter the password to access event details.</p>
      </div>

      {/* Contact Host Modal */}
      <ContactHostModal
        open={showContactModal}
        onOpenChange={setShowContactModal}
        eventId={event.id}
        hostName={primaryHost?.name || 'the host'}
      />
    </div>
  );
}
