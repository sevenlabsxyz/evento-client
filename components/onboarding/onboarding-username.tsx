import { Input } from '@/components/ui/input';
import { motion } from 'framer-motion';
import { OnboardingHeader } from './onboarding-header';
import { useDebounce } from '@/lib/hooks/useDebounce';
import { useUserByUsername, useUserProfile } from '@/lib/hooks/useUserProfile';
import { useState, useEffect } from 'react';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';
import { updateUserProfileSchema } from '@/lib/schemas/user';
import { z } from 'zod';

interface OnboardingUsernameProps {
  username: string;
  updating: boolean;
  onUsernameChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onEnterPress: () => void;
}

export const OnboardingUsername = ({
  username,
  updating,
  onUsernameChange,
  onEnterPress,
}: OnboardingUsernameProps) => {
  const [validationError, setValidationError] = useState<string>('');
  const [isCheckingAvailability, setIsCheckingAvailability] = useState(false);
  const [isAvailable, setIsAvailable] = useState<boolean | null>(null);

  // Get current user to check if they're changing to their own username
  const { user: currentUser } = useUserProfile();

  // Debounce the username for API calls
  const debouncedUsername = useDebounce(username, 500);

  // Check if username exists using the public profile API
  const {
    data: existingUser,
    isLoading,
    refetch,
  } = useUserByUsername(debouncedUsername);

  // Validate username on change
  useEffect(() => {
    if (!username) {
      setValidationError('');
      setIsAvailable(null);
      return;
    }

    // Use the username schema from user.ts
    const usernameSchema = updateUserProfileSchema.pick({ username: true })
      .shape.username;

    try {
      usernameSchema.parse(username);
      setValidationError('');
    } catch (error) {
      if (error instanceof z.ZodError) {
        setValidationError(error.issues?.[0]?.message || 'Invalid username');
        setIsAvailable(null);
      }
    }
  }, [username]);

  // Check availability when debounced username changes
  useEffect(() => {
    if (!debouncedUsername || validationError) {
      setIsCheckingAvailability(false);
      setIsAvailable(null);
      return;
    }

    // If it's the current user's username, it's available for them
    if (currentUser?.username === debouncedUsername) {
      setIsAvailable(true);
      return;
    }

    // Only check if validation passes
    if (debouncedUsername.length >= 3) {
      setIsCheckingAvailability(true);
      refetch().then(({ data: freshData }) => {
        setIsCheckingAvailability(false);
        // If no user found, username is available
        setIsAvailable(!freshData);
      });
    }
  }, [debouncedUsername, validationError, refetch, currentUser]);

  const showValidation = username.length > 0;
  const canProceed =
    username.length >= 3 && !validationError && isAvailable === true;

  return (
    <motion.div
      key='username'
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2, ease: 'easeInOut' }}
    >
      <OnboardingHeader
        title='Choose a username'
        description='This will be your unique Evento identifier. You can change your @username anytime in your Profile Settings.'
      />

      <div className='mt-6'>
        <div className='relative'>
          <Input
            required
            autoFocus
            value={username}
            disabled={updating}
            placeholder={'shakespeare123'}
            onChange={onUsernameChange}
            className={`
              placeholder:text-gray-300 bg-gray-100 border mb-2 text-2xl md:text-2xl px-3 py-2 min-h-[60px] pr-12
              ${validationError && showValidation ? 'border-red-500' : ''}
              ${canProceed ? 'border-green-500' : ''}
            `}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && canProceed) onEnterPress();
            }}
          />

          {/* Status indicator */}
          <div className='absolute right-3 top-1/2 -translate-y-1/2'>
            {isCheckingAvailability || isLoading ? (
              <Loader2 className='h-5 w-5 animate-spin text-gray-400' />
            ) : isAvailable === true && !validationError && showValidation ? (
              <CheckCircle className='h-5 w-5 text-green-500' />
            ) : isAvailable === false && showValidation ? (
              <XCircle className='h-5 w-5 text-red-500' />
            ) : null}
          </div>
        </div>

        {/* Validation messages */}
        {showValidation && (
          <div className='text-sm mt-1'>
            {validationError ? (
              <p className='text-red-500'>{validationError}</p>
            ) : isAvailable === false ? (
              <p className='text-red-500'>This username is already taken</p>
            ) : isAvailable === true ? (
              <p className='text-green-500'>
                Great! This username is available
              </p>
            ) : null}
          </div>
        )}
      </div>
    </motion.div>
  );
};
