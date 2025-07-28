import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { motion } from 'framer-motion';
import { Camera, Loader2, UploadCloud } from 'lucide-react';
import { RefObject } from 'react';
import { OnboardingHeader } from './onboarding-header';

interface OnboardingAvatarProps {
  uploadedImg: string;
  isLoading: boolean;
  inputFileRef: RefObject<HTMLInputElement>;
  onFileChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

export const OnboardingAvatar = ({
  uploadedImg,
  isLoading,
  inputFileRef,
  onFileChange,
}: OnboardingAvatarProps) => {
  return (
    <motion.div
      key='profile'
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2, ease: 'easeInOut' }}
    >
      <OnboardingHeader
        title='Upload a profile picture'
        description='Help others recognize you at Events.'
      />

      <div className='flex flex-col items-center justify-center py-6 md:py-12'>
        <input
          name='file'
          ref={inputFileRef}
          type='file'
          accept='.png, .gif, .jpg, .jpeg'
          style={{ display: 'none' }}
          onChange={onFileChange}
        />
        <div
          onClick={() => inputFileRef.current?.click()}
          className='group relative mb-12 rounded-full border'
        >
          {isLoading ? (
            <div className='absolute bottom-0 left-0 right-0 top-0 z-20 flex cursor-default flex-row items-center justify-center rounded-full bg-black opacity-0 opacity-75'>
              <Loader2 className='h-12 w-12 animate-spin text-white' />
            </div>
          ) : (
            <div className='absolute bottom-0 left-0 right-0 top-0 z-20 flex cursor-pointer flex-row items-center justify-center rounded-full bg-black opacity-0 md:group-hover:opacity-50'>
              <UploadCloud className='h-12 w-12 text-white' />
            </div>
          )}
          <Avatar className='md:h-64 md:w-64'>
            <AvatarImage src={uploadedImg || '/assets/logo/sublogo.svg'} />
            <AvatarFallback className='text-xs'>Loading...</AvatarFallback>
          </Avatar>
          {isLoading ? null : (
            <div className='absolute -bottom-2 right-0 z-30 rounded-full border bg-gray-100 p-2 md:bottom-2 md:right-2'>
              <Camera className='h-6 w-6 text-gray-600' />
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};
