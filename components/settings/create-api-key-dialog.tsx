'use client';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useCreateApiKey } from '@/lib/hooks/use-api-keys';
import { toast } from '@/lib/utils/toast';
import { Check, Copy } from 'lucide-react';
import { useEffect, useState } from 'react';

interface CreateApiKeyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateApiKeyDialog({ open, onOpenChange }: CreateApiKeyDialogProps) {
  const [name, setName] = useState('');
  const [generatedKey, setGeneratedKey] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const createApiKey = useCreateApiKey();

  // Reset state when dialog closes
  useEffect(() => {
    if (!open) {
      setName('');
      setGeneratedKey(null);
      setCopied(false);
    }
  }, [open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      toast.error('Please enter a name for your API key');
      return;
    }

    try {
      const result = await createApiKey.mutateAsync({ name: name.trim() });
      setGeneratedKey(result.key);
      toast.success('API key created successfully');
    } catch (error) {
      if (error instanceof Error) {
        toast.error(error.message);
      } else {
        toast.error('Failed to create API key');
      }
    }
  };

  const handleCopy = async () => {
    if (!generatedKey) return;

    try {
      await navigator.clipboard.writeText(generatedKey);
      setCopied(true);
      toast.success('API key copied to clipboard');

      // Reset copied state after 2 seconds
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast.error('Failed to copy API key');
    }
  };

  const handleClose = () => {
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='sm:max-w-[500px]'>
        {!generatedKey ? (
          <>
            <DialogHeader>
              <DialogTitle>Create API Key</DialogTitle>
              <DialogDescription>
                Give your API key a descriptive name to help you identify it later.
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSubmit}>
              <div className='space-y-4 py-4'>
                <div className='space-y-2'>
                  <Label htmlFor='name'>Name *</Label>
                  <Input
                    id='name'
                    placeholder='e.g., Production API Key'
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    maxLength={50}
                    disabled={createApiKey.isPending}
                    autoFocus
                  />
                  <p className='text-xs text-gray-500'>Maximum 50 characters</p>
                </div>
              </div>

              <DialogFooter>
                <Button
                  type='button'
                  variant='outline'
                  onClick={handleClose}
                  disabled={createApiKey.isPending}
                >
                  Cancel
                </Button>
                <Button
                  type='submit'
                  disabled={!name.trim() || createApiKey.isPending}
                  className='bg-red-500 hover:bg-red-600'
                >
                  {createApiKey.isPending ? 'Creating...' : 'Create Key'}
                </Button>
              </DialogFooter>
            </form>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>API Key Created</DialogTitle>
              <DialogDescription className='space-y-2'>
                <span className='block'>Your API key has been created successfully.</span>
                <span className='block font-semibold text-red-600'>
                  Make sure to copy it now. You won&apos;t be able to see it again!
                </span>
              </DialogDescription>
            </DialogHeader>

            <div className='space-y-4 py-4'>
              <div className='space-y-2'>
                <Label htmlFor='api-key'>API Key</Label>
                <div className='relative'>
                  <Input
                    id='api-key'
                    value={generatedKey}
                    readOnly
                    className='h-10 pr-12 font-mono text-sm'
                  />
                  <Button
                    type='button'
                    size='icon'
                    variant='ghost'
                    onClick={handleCopy}
                    whileTap={{ scale: 1 }}
                    className='absolute right-0 top-0 h-full w-10 origin-center rounded-l-none rounded-r-md'
                  >
                    {copied ? (
                      <Check className='h-4 w-4 text-green-600' />
                    ) : (
                      <Copy className='h-4 w-4' />
                    )}
                  </Button>
                </div>
              </div>

              <div className='rounded-lg border border-red-200 bg-red-50 p-4'>
                <p className='text-sm text-red-800'>
                  <strong>Important:</strong> Store this API key securely. It will not be shown
                  again after you close this dialog.
                </p>
              </div>
            </div>

            <DialogFooter>
              <Button onClick={handleClose} className='bg-red-500 hover:bg-red-600'>
                I&apos;ve Saved My Key
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
