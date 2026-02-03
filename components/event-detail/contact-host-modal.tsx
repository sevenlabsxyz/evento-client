'use client';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { MasterScrollableSheet } from '@/components/ui/master-scrollable-sheet';
import { Textarea } from '@/components/ui/textarea';
import { useContactHost } from '@/lib/hooks/use-contact-host';
import { toast } from '@/lib/utils/toast';
import { AlertCircle, Loader2, Mail, MessageSquare, User } from 'lucide-react';
import { useState } from 'react';

interface ContactHostModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  eventId: string;
  hostName: string;
}

export function ContactHostModal({ open, onOpenChange, eventId, hostName }: ContactHostModalProps) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const contactHost = useContactHost();

  const resetForm = () => {
    setName('');
    setEmail('');
    setMessage('');
    setError(null);
    setSuccess(false);
  };

  const handleClose = () => {
    onOpenChange(false);
    // Reset form after animation completes
    setTimeout(resetForm, 300);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validate fields
    if (!name.trim()) {
      setError('Please enter your name');
      return;
    }
    if (!email.trim()) {
      setError('Please enter your email');
      return;
    }
    if (!message.trim()) {
      setError('Please enter a message');
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Please enter a valid email address');
      return;
    }

    contactHost.mutate(
      {
        eventId,
        form: {
          name: name.trim(),
          email: email.trim(),
          message: message.trim(),
        },
      },
      {
        onSuccess: () => {
          setSuccess(true);
          toast.success('Message sent to host!');
          // Close modal after a brief delay
          setTimeout(handleClose, 1500);
        },
        onError: (err) => {
          setError(err.message || 'Failed to send message. Please try again.');
        },
      }
    );
  };

  return (
    <MasterScrollableSheet title='Contact Host' open={open} onOpenChange={onOpenChange}>
      <div className='px-4 pb-8'>
        <p className='mb-6 text-left text-sm text-gray-600'>
          Send a message to <span className='font-medium'>{hostName}</span> to request access to
          this event.
        </p>

        {/* Success/Error Message */}
        {error && (
          <Alert variant='destructive' className='mb-4 bg-red-50'>
            <AlertCircle className='h-4 w-4' />
            <AlertDescription className='-mb-1 mt-0.5'>{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert className='mb-4 border-green-200 bg-green-50 text-green-800'>
            <AlertCircle className='h-4 w-4' />
            <AlertDescription className='-mb-1 mt-0.5'>Message sent successfully!</AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit} className='space-y-4'>
          {/* Name Field */}
          <div className='space-y-2'>
            <label htmlFor='contact-name' className='text-sm font-medium'>
              Your Name
            </label>
            <div className='relative'>
              <User className='absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400' />
              <Input
                id='contact-name'
                type='text'
                placeholder='Enter your name'
                className='bg-gray-50 pl-10'
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={contactHost.isPending || success}
              />
            </div>
          </div>

          {/* Email Field */}
          <div className='space-y-2'>
            <label htmlFor='contact-email' className='text-sm font-medium'>
              Your Email
            </label>
            <div className='relative'>
              <Mail className='absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400' />
              <Input
                id='contact-email'
                type='email'
                placeholder='you@example.com'
                className='bg-gray-50 pl-10'
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={contactHost.isPending || success}
              />
            </div>
          </div>

          {/* Message Field */}
          <div className='space-y-2'>
            <label htmlFor='contact-message' className='text-sm font-medium'>
              Message
            </label>
            <div className='relative'>
              <MessageSquare className='absolute left-3 top-3 h-4 w-4 text-gray-400' />
              <Textarea
                id='contact-message'
                placeholder='Hi, I would like to attend your event...'
                className='min-h-[100px] bg-gray-50 pl-10'
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                disabled={contactHost.isPending || success}
              />
            </div>
          </div>

          <Button
            type='submit'
            className='w-full py-6 text-base'
            disabled={contactHost.isPending || success}
          >
            {contactHost.isPending ? (
              <>
                <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                Sending...
              </>
            ) : success ? (
              'Sent!'
            ) : (
              'Send Message'
            )}
          </Button>
        </form>
      </div>
    </MasterScrollableSheet>
  );
}
