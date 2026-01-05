'use client';

import { Button } from '@/components/ui/button';
import { DetachedSheet } from '@/components/ui/detached-sheet';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Eye, EyeOff, KeyRound, ShieldCheck, ShieldOff } from 'lucide-react';
import { useEffect, useState } from 'react';

interface PasswordProtectionSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (enabled: boolean, password: string | null) => void;
  isPasswordProtected: boolean;
  currentPassword: string | null;
}

export default function PasswordProtectionSheet({
  isOpen,
  onClose,
  onSave,
  isPasswordProtected,
  currentPassword,
}: PasswordProtectionSheetProps) {
  const [enabled, setEnabled] = useState(isPasswordProtected);
  const [password, setPassword] = useState(currentPassword || '');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Sync state when props change
  useEffect(() => {
    setEnabled(isPasswordProtected);
    setPassword(currentPassword || '');
  }, [isPasswordProtected, currentPassword, isOpen]);

  const handleSave = () => {
    setError(null);

    // Validate password if protection is enabled
    if (enabled && !password.trim()) {
      setError('Please enter a password');
      return;
    }

    if (enabled && password.trim().length < 4) {
      setError('Password must be at least 4 characters');
      return;
    }

    onSave(enabled, enabled ? password.trim() : null);
    onClose();
  };

  const handleToggle = (newEnabled: boolean) => {
    setEnabled(newEnabled);
    if (!newEnabled) {
      setPassword('');
      setError(null);
    }
  };

  return (
    <DetachedSheet.Root
      presented={isOpen}
      onPresentedChange={(presented) => !presented && onClose()}
    >
      <DetachedSheet.Portal>
        <DetachedSheet.View>
          <DetachedSheet.Backdrop />
          <DetachedSheet.Content>
            <div className='p-6'>
              {/* Handle */}
              <div className='mb-4 flex justify-center'>
                <DetachedSheet.Handle />
              </div>

              {/* Header */}
              <div className='mb-6'>
                <h2 className='text-center text-xl font-semibold'>Password Protection</h2>
                <p className='mt-2 text-center text-sm text-gray-500'>
                  Require a password to view event details
                </p>
              </div>

              {/* Toggle Section */}
              <div className='mb-6 rounded-xl border-2 border-gray-200 bg-white p-4'>
                <div className='flex items-center justify-between'>
                  <div className='flex items-center gap-3'>
                    <div
                      className={`flex h-10 w-10 items-center justify-center rounded-lg ${
                        enabled ? 'bg-red-500 text-white' : 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      {enabled ? (
                        <ShieldCheck className='h-5 w-5' />
                      ) : (
                        <ShieldOff className='h-5 w-5' />
                      )}
                    </div>
                    <div>
                      <h3 className='font-semibold text-gray-900'>
                        {enabled ? 'Protected' : 'Not Protected'}
                      </h3>
                      <p className='text-sm text-gray-500'>
                        {enabled ? 'Password required to view' : 'Anyone with link can view'}
                      </p>
                    </div>
                  </div>
                  <Switch checked={enabled} onCheckedChange={handleToggle} />
                </div>
              </div>

              {/* Password Input - Only shown when enabled */}
              {enabled && (
                <div className='mb-6 space-y-4'>
                  <div className='space-y-2'>
                    <label htmlFor='event-password' className='text-sm font-medium'>
                      Event Password
                    </label>
                    <div className='relative'>
                      <KeyRound className='absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400' />
                      <Input
                        id='event-password'
                        type={showPassword ? 'text' : 'password'}
                        placeholder='Enter password'
                        className='bg-gray-50 pl-10 pr-10'
                        value={password}
                        onChange={(e) => {
                          setPassword(e.target.value);
                          setError(null);
                        }}
                      />
                      <button
                        type='button'
                        className='absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600'
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? <EyeOff className='h-4 w-4' /> : <Eye className='h-4 w-4' />}
                      </button>
                    </div>
                    {error && <p className='text-sm text-red-500'>{error}</p>}
                  </div>

                  <div className='rounded-lg bg-gray-50 p-3'>
                    <p className='text-xs text-gray-500'>
                      <strong>Note:</strong> Hosts, co-hosts, and guests who have already RSVP'd
                      "Yes" will automatically bypass the password.
                    </p>
                  </div>
                </div>
              )}

              {/* Save Button */}
              <Button onClick={handleSave} className='w-full py-6 text-base'>
                Save
              </Button>
            </div>
          </DetachedSheet.Content>
        </DetachedSheet.View>
      </DetachedSheet.Portal>
    </DetachedSheet.Root>
  );
}
