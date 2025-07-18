'use client';

import { useOnboardingState, useOnboardingActions } from '@/lib/stores/onboarding-store';
import { OnboardingHeader } from './onboarding-header';
import { OnboardingProgressBar } from './onboarding-progress-bar';
import { WelcomeStep } from './steps/welcome-step';
import { ProfileStep } from './steps/profile-step';
import { SocialStep } from './steps/social-step';
import { PreferencesStep } from './steps/preferences-step';
import { CompleteStep } from './steps/complete-step';

export function OnboardingFlow() {
  const { currentStep } = useOnboardingState();

  const renderStep = () => {
    switch (currentStep) {
      case 'welcome':
        return <WelcomeStep />;
      case 'profile':
        return <ProfileStep />;
      case 'social':
        return <SocialStep />;
      case 'preferences':
        return <PreferencesStep />;
      case 'complete':
        return <CompleteStep />;
      default:
        return <WelcomeStep />;
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
      <OnboardingHeader />
      <OnboardingProgressBar />
      <div className="flex-1 px-4 py-6">
        {renderStep()}
      </div>
    </div>
  );
}