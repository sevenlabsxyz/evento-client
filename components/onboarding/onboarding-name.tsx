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
      <OnboardingHeader
        title='Enter your name'
        description='Let everyone know what to call you.'
      />
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
            'placeholder:text-gray-300 bg-gray-100 border mb-2 text-2xl md:text-2xl px-3 py-2 min-h-[60px]'
          }
          onKeyDown={(e) => {
            if (e.key === 'Enter') onEnterPress();
          }}
        />
      </div>
    </motion.div>
  );
};
