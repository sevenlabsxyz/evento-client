import { UserOnboardingFlow } from '@/components/onboarding';
import { useAuth } from '@/lib/hooks/use-auth';
import { useReplaceInterests } from '@/lib/hooks/use-user-interests';
import { useUpdateUserProfile, useUserProfile } from '@/lib/hooks/use-user-profile';
import { useAnswerPrompt } from '@/lib/hooks/use-user-prompts';
import { fireEvent, render, screen } from '@testing-library/react';

const mockLogout = jest.fn();

jest.mock('@/lib/hooks/use-auth', () => ({
  useAuth: jest.fn(),
}));

jest.mock('@/lib/hooks/use-user-profile', () => ({
  useUserProfile: jest.fn(),
  useUpdateUserProfile: jest.fn(),
}));

jest.mock('@/lib/hooks/use-user-interests', () => ({
  useReplaceInterests: jest.fn(),
}));

jest.mock('@/lib/hooks/use-user-prompts', () => ({
  useAnswerPrompt: jest.fn(),
}));

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: jest.fn() }),
  useSearchParams: () => ({ get: jest.fn().mockReturnValue(null) }),
}));

jest.mock('next/image', () => ({
  __esModule: true,
  default: (props: React.ImgHTMLAttributes<HTMLImageElement>) => <img {...props} />,
}));

jest.mock('framer-motion', () => ({
  AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

jest.mock('@/components/onboarding/onboarding-name', () => ({
  OnboardingName: () => <div>name step</div>,
}));

jest.mock('@/components/onboarding/onboarding-username', () => ({
  OnboardingUsername: () => <div>username step</div>,
}));

jest.mock('@/components/onboarding/onboarding-avatar', () => ({
  OnboardingAvatar: () => <div>avatar step</div>,
}));

jest.mock('@/components/onboarding/onboarding-interests', () => ({
  OnboardingInterests: () => <div>interests step</div>,
}));

jest.mock('@/components/onboarding/onboarding-prompts', () => ({
  OnboardingPrompts: () => <div>prompts step</div>,
}));

jest.mock('@/components/onboarding/step-indicator', () => ({
  StepIndicator: () => <div />,
}));

const mockedUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;

beforeEach(() => {
  jest.clearAllMocks();
  mockedUseAuth.mockReturnValue({
    user: null,
    isAuthenticated: true,
    isLoading: false,
    email: null,
    checkAuth: jest.fn(),
    logout: mockLogout,
    isLoggingOut: false,
  });
  (useReplaceInterests as jest.Mock).mockReturnValue({ mutateAsync: jest.fn() });
  (useUpdateUserProfile as jest.Mock).mockReturnValue({
    mutateAsync: jest.fn(),
    isPending: false,
  });
  (useUserProfile as jest.Mock).mockReturnValue({ user: null, isLoading: false });
  (useAnswerPrompt as jest.Mock).mockReturnValue({ mutateAsync: jest.fn() });
});

describe('UserOnboardingFlow exit action', () => {
  it('offers an exit action that delegates to auth logout', () => {
    render(<UserOnboardingFlow onSubmit={jest.fn()} />);

    fireEvent.click(screen.getByRole('button', { name: /exit setup/i }));

    expect(mockLogout).toHaveBeenCalledTimes(1);
  });

  it('disables onboarding actions while exiting', () => {
    mockedUseAuth.mockReturnValue({
      user: null,
      isAuthenticated: true,
      isLoading: false,
      email: null,
      checkAuth: jest.fn(),
      logout: mockLogout,
      isLoggingOut: true,
    });

    render(<UserOnboardingFlow onSubmit={jest.fn()} />);

    expect(screen.getByRole('button', { name: /exit setup/i })).toBeDisabled();
    expect(screen.getByRole('button', { name: /continue/i })).toBeDisabled();
  });
});
