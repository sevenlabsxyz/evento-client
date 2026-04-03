'use client';

import { Button } from '@/components/ui/button';
import { ArrowRight, Lock, MessageCircleMore, ShieldCheck } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { useMemo, useState } from 'react';

const steps = [
  {
    icon: MessageCircleMore,
    eyebrow: 'Encrypted DMs',
    title: 'Private messages, built into Evento',
    description:
      'Chat lives alongside events and profiles, but your direct messages stay end-to-end encrypted.',
  },
  {
    icon: ShieldCheck,
    eyebrow: 'Local First',
    title: 'Your chat lives on your device',
    description:
      'Evento helps people find each other, but it does not hold your direct messages in a chat database.',
  },
  {
    icon: Lock,
    eyebrow: 'Behind The Scenes',
    title: 'We set up your secure identity for you',
    description:
      'You do not need to handle keys to get started. Advanced controls can live in settings later if you want them.',
  },
] as const;

interface ChatOnboardingProps {
  isLoading: boolean;
  onStart: () => Promise<void>;
}

export function ChatOnboarding({ isLoading, onStart }: ChatOnboardingProps) {
  const [stepIndex, setStepIndex] = useState(0);
  const activeStep = useMemo(() => steps[stepIndex], [stepIndex]);
  const isLastStep = stepIndex === steps.length - 1;
  const StepIcon = activeStep.icon;

  return (
    <div className='flex h-full min-h-[calc(100vh-4rem)] items-center justify-center bg-[radial-gradient(circle_at_top,_rgba(239,68,68,0.14),_transparent_42%),linear-gradient(180deg,_#fff_0%,_#fafafa_100%)] px-4 py-8'>
      <div className='w-full max-w-xl rounded-[2rem] border border-black/5 bg-white/90 p-6 shadow-[0_30px_80px_rgba(15,23,42,0.08)] backdrop-blur md:p-8'>
        <div className='mb-8 flex gap-2'>
          {steps.map((step, index) => (
            <div
              key={step.title}
              className={`h-1.5 flex-1 rounded-full transition-colors ${
                index <= stepIndex ? 'bg-red-500' : 'bg-gray-200'
              }`}
            />
          ))}
        </div>

        <AnimatePresence mode='wait'>
          <motion.div
            key={activeStep.title}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            transition={{ duration: 0.22, ease: 'easeOut' }}
          >
            <div className='mb-6 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50 text-red-500'>
              <StepIcon className='h-7 w-7' />
            </div>
            <p className='mb-2 text-xs font-semibold uppercase tracking-[0.24em] text-red-500'>
              {activeStep.eyebrow}
            </p>
            <h1 className='mb-3 text-3xl font-semibold tracking-tight text-gray-950'>
              {activeStep.title}
            </h1>
            <p className='max-w-lg text-base leading-7 text-gray-600'>{activeStep.description}</p>
          </motion.div>
        </AnimatePresence>

        <div className='mt-10 flex items-center justify-between'>
          <p className='text-sm text-gray-500'>
            Step {stepIndex + 1} of {steps.length}
          </p>
          {isLastStep ? (
            <Button
              onClick={() => void onStart()}
              disabled={isLoading}
              className='h-11 rounded-full px-6'
            >
              {isLoading ? "We're getting things going for you" : 'Start'}
            </Button>
          ) : (
            <Button
              onClick={() => setStepIndex((current) => Math.min(current + 1, steps.length - 1))}
              className='h-11 rounded-full px-5'
            >
              Next
              <ArrowRight className='ml-2 h-4 w-4' />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
