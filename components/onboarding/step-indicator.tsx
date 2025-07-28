import { motion } from 'framer-motion';

interface StepIndicatorProps {
  currentStep: number;
  totalSteps: number;
}

export const StepIndicator = ({
  currentStep,
  totalSteps,
}: StepIndicatorProps) => {
  return (
    <div className='flex w-full gap-1.5 mb-6'>
      {Array.from({ length: totalSteps }).map((_, index) => (
        <div
          key={index}
          className='h-1 flex-1 bg-gray-100 overflow-hidden rounded-full'
        >
          <motion.div
            className='h-full w-full bg-red-600 origin-left'
            initial={{ scaleX: 0 }}
            animate={{ scaleX: currentStep > index ? 1 : 0 }}
            transition={{
              duration: 0.4,
              ease: 'easeInOut',
            }}
          />
        </div>
      ))}
    </div>
  );
};
