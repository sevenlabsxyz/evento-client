'use client';

import { EventoIcon } from '@/components/icons/evento';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { MasterScrollableSheet } from '@/components/ui/master-scrollable-sheet';
import apiClient from '@/lib/api/client';
import { useBetaAccess } from '@/lib/hooks/use-beta-access';
import { toast } from '@/lib/utils/toast';
import { AlertCircle, KeyRound, Loader2, Mail, Sparkles } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export function BetaGate() {
  const router = useRouter();
  const { validateCode, grantAccess } = useBetaAccess();
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'loading' | 'success' | 'error'>(
    'idle'
  );
  const [submitMessage, setSubmitMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!code.trim()) {
      setError('Please enter an invite code');
      return;
    }

    setIsLoading(true);

    // Small delay for UX
    await new Promise((resolve) => setTimeout(resolve, 500));

    if (validateCode(code.trim())) {
      grantAccess();
      toast.success('Welcome to the beta!');
      router.push('/auth/login');
    } else {
      setError('Invalid invite code. Please try again.');
      setIsLoading(false);
    }
  };

  const handleRequestAccess = () => {
    setIsSheetOpen(true);
    setSubmitStatus('idle');
    setSubmitMessage('');
    setEmail('');
  };

  const handleSubmitEmail = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email.trim()) {
      setSubmitStatus('error');
      setSubmitMessage('Please enter your email address');
      return;
    }

    setSubmitStatus('loading');
    setSubmitMessage('');

    try {
      const response = await apiClient.post<{
        success: boolean;
        message: string;
        data?: { alreadyExists?: boolean };
      }>('/v1/beta-access', { email: email.trim() });

      setSubmitStatus('success');
      setSubmitMessage(
        response.data?.alreadyExists
          ? "You're already on the waitlist!"
          : "You're on the list! We'll be in touch soon."
      );
      setEmail('');

      // Close sheet after a delay
      setTimeout(() => {
        setIsSheetOpen(false);
        toast.success(
          response.data?.alreadyExists
            ? "You're already on the waitlist!"
            : "Request submitted! We'll be in touch soon."
        );
      }, 1500);
    } catch (err: any) {
      setSubmitStatus('error');
      setSubmitMessage(err.message || 'Something went wrong. Please try again.');
    }
  };

  return (
    <div className='flex min-h-screen flex-col items-center justify-center bg-white p-4'>
      <Card className='w-full max-w-sm rounded-3xl bg-gray-50'>
        <CardHeader className='space-y-1'>
          <div className='mx-auto flex w-full items-center justify-center'>
            <EventoIcon className='h-14 w-14 rounded-full border border-gray-200' />
          </div>
          <CardTitle className='text-center text-xl font-bold'>Welcome to Evento Beta</CardTitle>
          <CardDescription className='text-center'>
            Enter your invite code to access the beta, or request access to join the waitlist.
          </CardDescription>
        </CardHeader>
        <CardContent className='space-y-4'>
          {/* Error Alert */}
          {error && (
            <Alert variant='destructive' className='bg-red-50 leading-none'>
              <AlertCircle className='h-4 w-4' />
              <AlertDescription className='-mb-1 mt-0.5'>{error}</AlertDescription>
            </Alert>
          )}

          {/* Invite Code Form */}
          <form onSubmit={handleSubmit} className='space-y-4'>
            <div className='space-y-2'>
              <label htmlFor='code' className='text-sm font-medium'>
                Invite Code
              </label>
              <div className='relative'>
                <KeyRound className='absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400' />
                <Input
                  id='code'
                  type='text'
                  placeholder='Enter your invite code'
                  className='bg-white pl-10'
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  disabled={isLoading}
                />
              </div>
            </div>

            <Button type='submit' className='w-full py-6 text-base' disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                  Verifying...
                </>
              ) : (
                'Enter Beta'
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

          {/* Request Access Button */}
          <Button
            variant='secondary'
            className='w-full border border-gray-200 bg-white py-6 text-base'
            onClick={handleRequestAccess}
            disabled={isLoading}
          >
            <Sparkles className='mr-2 h-4 w-4' />
            Request Access
          </Button>
        </CardContent>
      </Card>
      <div className='mx-auto my-4 w-full max-w-xs text-center text-xs tracking-wide text-muted-foreground opacity-75'>
        <p>Evento is currently in private beta. Stay tuned for public launch!</p>
      </div>

      {/* Request Access Sheet */}
      <MasterScrollableSheet
        title='Request Beta Access'
        open={isSheetOpen}
        onOpenChange={setIsSheetOpen}
      >
        <div className='px-4 pb-8'>
          <p className='mb-6 text-left text-sm text-gray-600'>
            Enter your email to join the waitlist and be notified when we launch.
          </p>

          {/* Success/Error Message */}
          {submitMessage && (
            <Alert
              variant={submitStatus === 'error' ? 'destructive' : 'default'}
              className={`mb-4 ${submitStatus === 'success' ? 'border-green-200 bg-green-50 text-green-800' : 'bg-red-50'}`}
            >
              <AlertCircle className='h-4 w-4' />
              <AlertDescription className='-mb-1 mt-0.5'>{submitMessage}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmitEmail} className='space-y-4'>
            <div className='space-y-2'>
              <label htmlFor='email' className='text-sm font-medium'>
                Email
              </label>
              <div className='relative'>
                <Mail className='absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400' />
                <Input
                  id='email'
                  type='email'
                  placeholder='you@example.com'
                  className='bg-gray-50 pl-10'
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={submitStatus === 'loading' || submitStatus === 'success'}
                />
              </div>
            </div>

            <Button
              type='submit'
              className='w-full py-6 text-base'
              disabled={submitStatus === 'loading' || submitStatus === 'success'}
            >
              {submitStatus === 'loading' ? (
                <>
                  <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                  Submitting...
                </>
              ) : submitStatus === 'success' ? (
                'Done!'
              ) : (
                'Join Waitlist'
              )}
            </Button>
          </form>
        </div>
      </MasterScrollableSheet>
    </div>
  );
}
