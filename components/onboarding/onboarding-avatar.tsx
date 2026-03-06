import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { motion } from 'framer-motion';
import { Camera, Loader2, UploadCloud } from 'lucide-react';
import { RefObject } from 'react';
import { OnboardingHeader } from './onboarding-header';

interface OnboardingAvatarProps {
  uploadedImg: string;
  isLoading: boolean;
  inputFileRef: RefObject<HTMLInputElement | null>;
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
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
    >
      <OnboardingHeader
        title='Upload a profile picture'
        description='Help others recognize you at Events.'
      />

      <div className='mt-8 flex flex-col items-center justify-center'>
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
          className='group relative cursor-pointer rounded-full'
        >
          {isLoading ? (
            <div className='absolute inset-0 z-20 flex items-center justify-center rounded-full bg-black/60'>
              <Loader2 className='h-10 w-10 animate-spin text-white' />
            </div>
          ) : (
            <div className='absolute inset-0 z-20 flex items-center justify-center rounded-full bg-black/0 transition-all duration-200 md:group-hover:bg-black/40'>
              <UploadCloud className='h-10 w-10 text-white opacity-0 transition-opacity md:group-hover:opacity-100' />
            </div>
          )}
          <Avatar className='h-40 w-40 border-4 border-gray-100 shadow-lg md:h-48 md:w-48'>
            <AvatarImage src={uploadedImg || '/assets/logo/sublogo.svg'} />
            <AvatarFallback className='text-xs'>Loading...</AvatarFallback>
          </Avatar>
          {!isLoading && (
            <div className='absolute -bottom-1 -right-1 z-30 rounded-full border-2 border-white bg-red-600 p-2 shadow-md'>
              <Camera className='h-5 w-5 text-white' />
            </div>
          )}
        </div>
        <p className='mt-4 text-center text-sm text-gray-500'>Tap to upload</p>
      </div>
    </motion.div>
  );
};
