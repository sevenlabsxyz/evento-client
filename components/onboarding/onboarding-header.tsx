'use client';

import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { useOnboardingActions } from '@/lib/stores/onboarding-store';

export function OnboardingHeader() {
  const router = useRouter();
  const { completeOnboarding } = useOnboardingActions();

  const handleSkip = () => {
    completeOnboarding();
    router.push('/');
  };

  return (
    <div className="flex items-center justify-between p-4 border-b">
      <div className="flex items-center space-x-2">
        <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
          <span className="text-primary-foreground text-sm font-bold">E</span>
        </div>
        <span className="font-semibold text-lg">Evento</span>
      </div>
      
      <Button
        variant="ghost"
        size="sm"
        onClick={handleSkip}
        className="text-muted-foreground hover:text-foreground"
      >
        Skip
        <X className="h-4 w-4 ml-1" />
      </Button>
    </div>
  );
}