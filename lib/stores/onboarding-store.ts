import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface OnboardingStepData {
  // Profile setup
  name?: string;
  username?: string;
  bio?: string;
  image?: string;
  
  // Social links
  bio_link?: string;
  x_handle?: string;
  instagram_handle?: string;
  
  // Crypto/Web3
  ln_address?: string;
  nip05?: string;
  
  // Preferences
  interests?: string[];
  location?: string;
  timezone?: string;
}

export type OnboardingStep = 
  | 'welcome'
  | 'profile'
  | 'social'
  | 'preferences'
  | 'complete';

interface OnboardingState {
  // State
  isOnboarding: boolean;
  currentStep: OnboardingStep;
  stepData: OnboardingStepData;
  completedSteps: OnboardingStep[];
  
  // Actions
  startOnboarding: () => void;
  completeOnboarding: () => void;
  setCurrentStep: (step: OnboardingStep) => void;
  updateStepData: (data: Partial<OnboardingStepData>) => void;
  markStepCompleted: (step: OnboardingStep) => void;
  canSkipTo: (step: OnboardingStep) => boolean;
  reset: () => void;
}

const initialState = {
  isOnboarding: false,
  currentStep: 'welcome' as OnboardingStep,
  stepData: {},
  completedSteps: [],
};

export const useOnboardingStore = create<OnboardingState>()(
  persist(
    (set, get) => ({
      ...initialState,
      
      startOnboarding: () => 
        set({ 
          isOnboarding: true, 
          currentStep: 'welcome',
          stepData: {},
          completedSteps: [],
        }),
      
      completeOnboarding: () => 
        set({ 
          isOnboarding: false,
          currentStep: 'complete',
          completedSteps: [...get().completedSteps, 'complete'],
        }),
      
      setCurrentStep: (step) => 
        set({ currentStep: step }),
      
      updateStepData: (data) => 
        set({ 
          stepData: { ...get().stepData, ...data } 
        }),
      
      markStepCompleted: (step) => {
        const completed = get().completedSteps;
        if (!completed.includes(step)) {
          set({ completedSteps: [...completed, step] });
        }
      },
      
      canSkipTo: (step) => {
        const stepOrder: OnboardingStep[] = ['welcome', 'profile', 'social', 'preferences', 'complete'];
        const currentIndex = stepOrder.indexOf(get().currentStep);
        const targetIndex = stepOrder.indexOf(step);
        
        // Can always go to previous steps or next immediate step
        return targetIndex <= currentIndex + 1;
      },
      
      reset: () => 
        set(initialState),
    }),
    {
      name: 'evento-onboarding-storage',
      
      // Persist onboarding state
      partialize: (state) => ({
        isOnboarding: state.isOnboarding,
        currentStep: state.currentStep,
        stepData: state.stepData,
        completedSteps: state.completedSteps,
      }),
    }
  )
);

// Helper selectors
export const useOnboardingState = () => {
  const { isOnboarding, currentStep, stepData, completedSteps } = useOnboardingStore();
  return { isOnboarding, currentStep, stepData, completedSteps };
};

export const useOnboardingActions = () => {
  const { 
    startOnboarding, 
    completeOnboarding, 
    setCurrentStep, 
    updateStepData, 
    markStepCompleted,
    canSkipTo,
    reset 
  } = useOnboardingStore();
  
  return { 
    startOnboarding, 
    completeOnboarding, 
    setCurrentStep, 
    updateStepData, 
    markStepCompleted,
    canSkipTo,
    reset 
  };
};