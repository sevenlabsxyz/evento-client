import { Input } from '@/components/ui/input';
import { motion } from 'framer-motion';
import { OnboardingHeader } from './onboarding-header';

interface OnboardingNameProps {
  name: string;
  updating: boolean;
  onNameChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onEnterPress: () => void;
}

export const OnboardingName = ({
  name,
  updating,
  onNameChange,
  onEnterPress,
}: OnboardingNameProps) => {
  return (
    <motion.div
      key='name'
      initial={{ opacity: 1 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2, ease: 'easeInOut' }}
    >
      <OnboardingHeader title='Enter your name' description='Let everyone know what to call you.' />
      <div className='mt-6'>
        <Input
          required
          autoFocus
          value={name}
          autoCapitalize='true'
          placeholder={'William Shakespeare'}
          disabled={updating}
          onChange={onNameChange}
          className={
            'mb-2 min-h-[60px] border bg-gray-100 px-3 py-2 text-2xl placeholder:text-gray-300 md:text-2xl'
          }
          onKeyDown={(e) => {
            if (e.key === 'Enter') onEnterPress();
          }}
        />
      </div>
    </motion.div>
  );
};
