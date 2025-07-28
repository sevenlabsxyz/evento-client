import { LucideIcon } from 'lucide-react';
import { AppRouterInstance } from 'next/dist/shared/lib/app-router-context.shared-runtime';

export interface OnboardingStep {
  title: string;
  description: string;
  image: string;
  imageSize?: {
    width: number;
    height: number;
  };
  noCard?: boolean;
  actionLabel: string;
  actionLabelIcon?: LucideIcon;
  onAction?: (router: AppRouterInstance) => void;
}

export interface OnboardingConfig {
  version: string;
  steps: OnboardingStep[];
  onComplete?: () => void;
  storageKey?: string;
}

export const DEFAULT_STORAGE_KEY = 'evento:onboarding:last_completed_version';
