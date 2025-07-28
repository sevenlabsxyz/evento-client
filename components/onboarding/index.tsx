'use client';

import { Button } from '@/components/ui/button';
import {
  useUserProfile,
  useUpdateUserProfile,
  useUploadProfileImage,
} from '@/lib/hooks/useUserProfile';
import { getCoverImageUrl500x500 } from '@/lib/utils/cover-images';
import { ArrowRight, Loader2 } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { toast } from '@/lib/utils/toast';
import { AnimatePresence } from 'framer-motion';
import { OnboardingName } from './onboarding-name';
import { OnboardingUsername } from './onboarding-username';
import { OnboardingAvatar } from './onboarding-avatar';
import { StepIndicator } from './step-indicator';
import Image from 'next/image';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { validateRedirectUrl } from '@/lib/utils/auth';

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
  const [username, setUsername] = useState(
    defaultUsername || user?.username || ''
  );
  const [uploadedImg, setUploadedImg] = useState(
    defaultAvatar || user?.image || ''
  );
  const [updating, setUpdating] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const inputFileRef = useRef<HTMLInputElement>(null);

  const handleNameChange = (e: any) => setName(e.target.value);
  const handleUsernameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
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
  };

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
      const uploadPromise = fetch(
        `/api/v1/user/details/image-upload?filename=${file.name}`,
        {
          method: 'POST',
          body: file,
        }
      );

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
        throw new Error(
          `Server returned ${response.status}: ${response.statusText}`
        );
      }

      const res = await response.json();

      if (!res.image) {
        throw new Error('No image path returned from server');
      }

      setUploadedImg(`${getCoverImageUrl500x500(res.image)}`);
      toast.success('Image uploaded successfully');
    } catch (error) {
      console.error('Image upload error:', error);
      toast.error(
        'Could not upload image. Please try again or skip this step.'
      );
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
  const nameExistsAndPassesValidation = name && String(name).length > 2;
  const usernameExistsAndPassesValidation =
    username && String(username).length > 2;
  let isSaveButtonDisabled = true;
  if (step === 1) {
    isSaveButtonDisabled = !nameExistsAndPassesValidation;
  } else if (step === 2) {
    isSaveButtonDisabled = !usernameExistsAndPassesValidation;
  } else {
    isSaveButtonDisabled = false;
  }

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
    } else {
      // In step 3, we proceed with whatever image state we have
      // Even if the user attempted to upload an image but it failed,
      // we should allow them to complete onboarding
      setUpdating(true);

      try {
        await updateUserProfile.mutateAsync({
          name,
          username,
          // Use whatever image value we have, even if empty
          image: image || '',
        });

        // Show success message
        toast.success('Welcome to Evento! Your profile is all set up.');

        // Get redirect URL from search params or use default
        const redirectUrl = validateRedirectUrl(
          searchParams.get('redirect') || '/'
        );

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

  const handleEnterPress = () =>
    updateUserFn({ name, username, image: uploadedImg });

  useEffect(() => {
    setName(user?.name || '');
    setUsername(user?.username || '');
    setUploadedImg(user?.image || '');
  }, [user?.name, user?.username, user?.image]);

  return (
    <div className='flex flex-col h-full'>
      <div className='flex-grow overflow-y-auto px-4 pt-4 md:px-0'>
        <div className='flex flex-col mb-6 md:px-4'>
          <StepIndicator currentStep={step} totalSteps={3} />
          <Link
            href='/'
            className='flex flex-col items-center gap-2 font-medium border border-gray-200 rounded-2xl p-1.5 shadow-sm mb-6 max-w-[60px] max-h-[60px] md:mx-auto'
          >
            <Image
              src='/assets/logo/sublogo.svg'
              alt='Evento'
              height='50'
              width='50'
            />
          </Link>
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
          </AnimatePresence>
        </div>
      </div>
      <div className='flex flex-col px-4 md:px-0'>
        <div className='flex flex-col gap-2'>
          {step > 1 && (
            <Button
              variant='ghost'
              className='h-[60px] flex-grow'
              onClick={() => setStep(step - 1)}
            >
              Back
            </Button>
          )}
          <Button
            disabled={isSaveButtonDisabled || isUpdating}
            className='h-[60px] flex-grow bg-red-600'
            onClick={() => updateUserFn({ name, username, image: uploadedImg })}
          >
            {updating ? (
              <>
                <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                Loading...
              </>
            ) : (
              <>
                {step === 1 || step === 2 ? 'Next' : 'Submit'}
                <ArrowRight className='ml-2 h-4 w-4' />
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};
