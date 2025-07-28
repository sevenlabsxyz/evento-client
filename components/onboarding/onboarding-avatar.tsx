import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Camera, Loader2, UploadCloud } from 'lucide-react';
import { motion } from 'framer-motion';
import { OnboardingHeader } from './onboarding-header';
import { RefObject } from 'react';

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
          className='group relative mb-12 border rounded-full'
        >
          {isLoading ? (
            <div className='bg-black absolute top-0 right-0 left-0 bottom-0 opacity-0 cursor-default opacity-75 rounded-full z-20 flex flex-row items-center justify-center'>
              <Loader2 className='h-12 w-12 animate-spin text-white' />
            </div>
          ) : (
            <div className='bg-black absolute top-0 right-0 left-0 bottom-0 opacity-0 cursor-pointer md:group-hover:opacity-50 rounded-full z-20 flex flex-row items-center justify-center'>
              <UploadCloud className='h-12 w-12 text-white' />
            </div>
          )}
          <Avatar className='md:w-64 md:h-64'>
            <AvatarImage src={uploadedImg || '/assets/logo/sublogo.svg'} />
            <AvatarFallback className='text-xs'>Loading...</AvatarFallback>
          </Avatar>
          {isLoading ? null : (
            <div className='absolute -bottom-2 md:bottom-2 right-0 md:right-2 p-2 rounded-full border bg-gray-100 z-30'>
              <Camera className='h-6 w-6 text-gray-600' />
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};
