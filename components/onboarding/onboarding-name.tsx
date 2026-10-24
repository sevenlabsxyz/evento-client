import { Input } from '@/components/ui/input';
import { motion } from 'framer-motion';
import { useTranslations } from 'next-intl';
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
  const t = useTranslations('onboarding.name');
  return (
    <motion.div
      key='name'
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
    >
      <OnboardingHeader title={t('title')} description={t('description')} />
      <div className='mt-6'>
        <Input
          required
          autoFocus
          value={name}
          autoCapitalize='true'
          placeholder={t('placeholder')}
          disabled={updating}
          onChange={onNameChange}
          className={
            'mb-2 min-h-[60px] rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-2xl placeholder:text-gray-300 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100 dark:placeholder:text-neutral-400 md:text-2xl'
          }
          onKeyDown={(e) => {
            if (e.key === 'Enter') onEnterPress();
          }}
        />
      </div>
    </motion.div>
  );
};
