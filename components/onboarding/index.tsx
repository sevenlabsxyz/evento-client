'use client';

import { Button } from '@/components/ui/button';
import { useReplaceInterests } from '@/lib/hooks/use-user-interests';
import { useUpdateUserProfile, useUserProfile } from '@/lib/hooks/use-user-profile';
import { useAnswerPrompt } from '@/lib/hooks/use-user-prompts';
import { validateRedirectUrl } from '@/lib/utils/auth';
import { getCoverImageUrl500x500 } from '@/lib/utils/cover-images';
import { toast } from '@/lib/utils/toast';
import { AnimatePresence } from 'framer-motion';
import { ArrowRight, Loader2 } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';
import { OnboardingAvatar } from './onboarding-avatar';
import { OnboardingInterests } from './onboarding-interests';
import { OnboardingName } from './onboarding-name';
import { OnboardingPrompts } from './onboarding-prompts';
import { OnboardingUsername } from './onboarding-username';
import { StepIndicator } from './step-indicator';

interface UserOnboardingFlowProps {
  onSubmit: Function;
  defaultName?: string;
  defaultAvatar?: string;
  defaultUsername?: string;
}

export const UserOnboardingFlow = ({
  onSubmit,
  defaultName,
  defaultAvatar,
  defaultUsername,
}: UserOnboardingFlowProps) => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useUserProfile();
  const updateUserProfile = useUpdateUserProfile();

  const [step, setStep] = useState(1);
  const [name, setName] = useState(defaultName || user?.name || '');
  const [username, setUsername] = useState(defaultUsername || user?.username || '');
  const [uploadedImg, setUploadedImg] = useState(defaultAvatar || user?.image || '');
  const [selectedInterestIds, setSelectedInterestIds] = useState<string[]>([]);
  const [answeredPrompts, setAnsweredPrompts] = useState<
    Array<{
      prompt_id: string;
      answer: string;
      is_visible: boolean;
      display_order: number;
    }>
  >([]);
  const [updating, setUpdating] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const inputFileRef = useRef<HTMLInputElement>(null);

  const replaceInterestsMutation = useReplaceInterests();
  const answerPromptMutation = useAnswerPrompt();

  const handleNameChange = useCallback((e: any) => setName(e.target.value), []);

  const handleUsernameChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const alphanumericRegex = /^[a-zA-Z0-9]*$/;
    const inputValue = e.target.value.trim();

    if (alphanumericRegex.test(inputValue) && inputValue.length <= 20) {
      setUsername(inputValue);
    } else {
      if (!alphanumericRegex.test(inputValue)) {
        toast.warning('Only letters and numbers are allowed in Usernames.');
      } else if (inputValue.length > 20) {
        toast.warning('Username must be 20 characters or less.');
      }
    }
  }, []);

  const handleUploadImage = async (event: any) => {
    setIsLoading(true);
    event.preventDefault();

    if (!inputFileRef.current?.files || !inputFileRef.current.files.length) {
      toast.error('No image selected. Please try again.');
      setIsLoading(false);
      return null;
    }

    const file = inputFileRef.current.files[0];

    try {
      // Set a timeout to handle cases where the upload might hang
      const uploadPromise = fetch(`/api/v1/user/details/image-upload?filename=${file.name}`, {
        method: 'POST',
        body: file,
      });

      // Create a timeout promise
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Upload timed out')), 30000)
      );

      // Race the upload against the timeout
      const response = await Promise.race([uploadPromise, timeoutPromise]);

      // Type check and process the response
      if (!(response instanceof Response)) {
        throw new Error('Upload failed');
      }

      if (!response.ok) {
        throw new Error(`Server returned ${response.status}: ${response.statusText}`);
      }

      const res = await response.json();

      if (!res.image) {
        throw new Error('No image path returned from server');
      }

      setUploadedImg(`${getCoverImageUrl500x500(res.image)}`);
      toast.success('Image uploaded successfully');
    } catch (error) {
      console.error('Image upload error:', error);
      toast.error('Could not upload image. Please try again or skip this step.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      const file = event.target.files[0];
      if (file && file.size > 10 * 1024 * 1024) {
        toast.error('File is too large, please select a file less than 10MB.');
        event.target.value = '';
      } else {
        handleUploadImage(event);
      }
    }
  };

  const isUpdating = updating || updateUserProfile.isPending;

  // Simplified button state logic
  const isSaveButtonDisabled = (() => {
    if (step === 1) return !name || name.length <= 2;
    if (step === 2) return !username || username.length <= 2;
    return false; // Steps 3, 4, 5, 6 - always enabled (skippable)
  })();

  const updateUserFn = async ({
    name,
    image,
    username,
  }: {
    name: string;
    image: string;
    username: string;
  }) => {
    if (step === 1) {
      setStep(2);
    } else if (step === 2) {
      setStep(3);
    } else if (step === 3) {
      setStep(4);
    } else if (step === 4) {
      // Save interests if any selected
      if (selectedInterestIds.length > 0) {
        try {
          await replaceInterestsMutation.mutateAsync(selectedInterestIds);
        } catch (error) {
          console.error('Error saving interests:', error);
          // Continue anyway - interests are optional
        }
      }
      setStep(5);
    } else {
      // Step 5 - Final step
      setUpdating(true);

      try {
        // Update basic profile info
        await updateUserProfile.mutateAsync({
          name,
          username,
          image: image || '',
        });

        // Save prompts if any answered
        const validPrompts = answeredPrompts.filter((p) => p.answer.length >= 5);
        if (validPrompts.length > 0) {
          try {
            for (const prompt of validPrompts) {
              await answerPromptMutation.mutateAsync({
                prompt_id: prompt.prompt_id,
                answer: prompt.answer,
                display_order: prompt.display_order,
              });
            }
          } catch (error) {
            console.error('Error saving prompts:', error);
            // Continue anyway - prompts are optional
          }
        }

        // Show success message
        toast.success('Welcome to Evento! Your profile is all set up.');

        // Get redirect URL from search params or use default
        const redirectUrl = validateRedirectUrl(searchParams.get('redirect') || '/');

        // Call onSubmit if provided, then redirect
        if (onSubmit) {
          onSubmit();
        }

        // Small delay to let the toast show before redirect
        setTimeout(() => {
          router.push(redirectUrl);
        }, 500);
      } catch (error) {
        console.error('Error updating user:', error);
        toast.error('There was a problem completing your profile setup.');
      } finally {
        setUpdating(false);
      }
    }
  };

  const handleEnterPress = () => updateUserFn({ name, username, image: uploadedImg });

  useEffect(() => {
    setName(user?.name || '');
    setUsername(user?.username || '');
    setUploadedImg(user?.image || '');
  }, [user?.name, user?.username, user?.image]);

  return (
    <div className='flex h-full flex-col'>
      {/* Header with logo and progress */}
      <div className='flex-shrink-0 px-4 pt-4 md:px-0'>
        <div className='mb-4 flex items-center justify-between md:justify-center'>
          <Link
            href='/'
            className='flex h-11 w-11 items-center justify-center rounded-xl border border-gray-200 bg-white shadow-sm transition-shadow hover:shadow-md'
          >
            <Image src='/assets/img/evento-sublogo.svg' alt='Evento' height='28' width='28' />
          </Link>
          <span className='text-sm text-gray-400 md:hidden'>Step {step} of 5</span>
        </div>
        <StepIndicator currentStep={step} totalSteps={5} />
      </div>

      {/* Content area */}
      <div className='flex-grow overflow-y-auto px-4 md:px-0'>
        <div className='py-2 md:px-4'>
          <AnimatePresence mode='wait'>
            {step === 1 && (
              <OnboardingName
                name={name}
                updating={updating}
                onNameChange={handleNameChange}
                onEnterPress={handleEnterPress}
              />
            )}
            {step === 2 && (
              <OnboardingUsername
                username={username}
                updating={updating}
                onUsernameChange={handleUsernameChange}
                onEnterPress={handleEnterPress}
              />
            )}
            {step === 3 && (
              <OnboardingAvatar
                uploadedImg={uploadedImg}
                isLoading={isLoading}
                inputFileRef={inputFileRef}
                onFileChange={handleFileChange}
              />
            )}
            {step === 4 && <OnboardingInterests onInterestsSelected={setSelectedInterestIds} />}
            {step === 5 && <OnboardingPrompts onPromptsAnswered={setAnsweredPrompts} />}
          </AnimatePresence>
        </div>
      </div>

      {/* Footer with buttons */}
      <div className='flex-shrink-0 border-t border-gray-100 bg-white px-4 pb-6 pt-4 md:border-t-0 md:px-0'>
        <div className='flex items-center gap-3'>
          {step > 1 && (
            <Button
              variant='outline'
              className='h-12 flex-shrink-0 px-6'
              onClick={() => setStep(step - 1)}
            >
              Back
            </Button>
          )}
          <Button
            disabled={isSaveButtonDisabled || isUpdating}
            className='h-12 flex-grow bg-red-600 hover:bg-red-700'
            onClick={() => updateUserFn({ name, username, image: uploadedImg })}
          >
            {updating ? (
              <>
                <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                Saving...
              </>
            ) : (
              <>
                {step < 4
                  ? 'Continue'
                  : step === 4
                    ? selectedInterestIds.length > 0
                      ? 'Continue'
                      : 'Skip'
                    : answeredPrompts.filter((p) => p.answer.length >= 5).length > 0
                      ? 'Complete Setup'
                      : 'Skip & Finish'}
                <ArrowRight className='ml-2 h-4 w-4' />
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};
