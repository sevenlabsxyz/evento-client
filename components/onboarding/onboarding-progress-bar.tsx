'use client';

import { Progress } from '@/components/ui/progress';
import { useOnboardingState } from '@/lib/stores/onboarding-store';

const stepProgressMap = {
  welcome: 0,
  profile: 25,
  social: 50,
  preferences: 75,
  complete: 100,
};

export function OnboardingProgressBar() {
  const { currentStep } = useOnboardingState();
  const progress = stepProgressMap[currentStep] || 0;

  return (
    <div className="px-4 py-2">
      <Progress value={progress} className="w-full" />
      <div className="flex justify-between text-xs text-muted-foreground mt-1">
        <span>Step {Object.keys(stepProgressMap).indexOf(currentStep) + 1} of {Object.keys(stepProgressMap).length}</span>
        <span>{progress}%</span>
      </div>
    </div>
  );
}