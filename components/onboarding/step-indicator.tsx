import { motion } from 'framer-motion';

interface StepIndicatorProps {
  currentStep: number;
  totalSteps: number;
}

export const StepIndicator = ({ currentStep, totalSteps }: StepIndicatorProps) => {
  return (
    <div className='mb-4 flex w-full gap-1.5'>
      {Array.from({ length: totalSteps }).map((_, index) => (
        <div key={index} className='h-1.5 flex-1 overflow-hidden rounded-full bg-gray-100'>
          <motion.div
            className='h-full w-full origin-left bg-red-600'
            initial={{ scaleX: 0 }}
            animate={{ scaleX: currentStep > index ? 1 : 0 }}
            transition={{
              duration: 0.3,
              ease: [0.4, 0, 0.2, 1],
              delay: currentStep > index ? 0.05 : 0,
            }}
          />
        </div>
      ))}
    </div>
  );
};
