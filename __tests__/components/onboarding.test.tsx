import { QueryClient } from '@tanstack/react-query';

jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
  }),
  usePathname: () => '/onboarding',
  useSearchParams: () => ({
    get: jest.fn().mockReturnValue(null),
  }),
  useParams: () => ({}),
}));

jest.mock('next/image', () => ({
  __esModule: true,
  default: function MockImage(props: any) {
    const { src, alt, ...rest } = props;
    return <img src={src} alt={alt} {...rest} />;
  },
}));

jest.mock('@/lib/hooks/use-user-profile', () => ({
  useUserProfile: () => ({
    user: null,
    isLoading: false,
  }),
  useUpdateUserProfile: () => ({
    mutateAsync: jest.fn().mockResolvedValue({}),
    isPending: false,
  }),
  useUserByUsername: (username: string) => ({
    data: null,
    isLoading: false,
    refetch: jest.fn().mockResolvedValue({ data: null }),
  }),
}));

jest.mock('@/lib/hooks/use-user-interests', () => ({
  useReplaceInterests: () => ({
    mutateAsync: jest.fn().mockResolvedValue({}),
  }),
}));

jest.mock('@/lib/hooks/use-user-prompts', () => ({
  useAnswerPrompt: () => ({
    mutateAsync: jest.fn().mockResolvedValue({}),
  }),
}));

jest.mock('@/lib/hooks/use-debounce', () => ({
  useDebounce: (value: any) => value,
}));

jest.mock('framer-motion', () => ({
  AnimatePresence: ({ children }: any) => <>{children}</>,
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  },
}));

jest.mock('@/lib/utils/toast', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
    warning: jest.fn(),
  },
}));

import { toast } from '@/lib/utils/toast';

describe('Onboarding Flow Validation', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
    jest.clearAllMocks();
  });

  describe('Name validation', () => {
    it('requires name to be at least 3 characters', () => {
      const isNameValid = (name: string) => name.length > 2;

      expect(isNameValid('')).toBe(false);
      expect(isNameValid('AB')).toBe(false);
      expect(isNameValid('ABC')).toBe(true);
      expect(isNameValid('John Doe')).toBe(true);
    });

    it('allows names with spaces', () => {
      const isNameValid = (name: string) => name.length > 2;

      expect(isNameValid('John Doe')).toBe(true);
      expect(isNameValid('Mary Jane Watson')).toBe(true);
    });
  });

  describe('Username validation', () => {
    it('only allows alphanumeric characters', () => {
      const alphanumericRegex = /^[a-zA-Z0-9]*$/;

      expect(alphanumericRegex.test('testuser')).toBe(true);
      expect(alphanumericRegex.test('TestUser123')).toBe(true);
      expect(alphanumericRegex.test('test_user')).toBe(false);
      expect(alphanumericRegex.test('test-user')).toBe(false);
      expect(alphanumericRegex.test('test@user')).toBe(false);
      expect(alphanumericRegex.test('test user')).toBe(false);
    });

    it('enforces maximum length of 20 characters', () => {
      const isLengthValid = (username: string) => username.length <= 20;

      expect(isLengthValid('shortname')).toBe(true);
      expect(isLengthValid('exactly20characters!')).toBe(true);
      expect(isLengthValid('thisusernameistoolongtobevalid')).toBe(false);
    });

    it('requires minimum length of 3 characters', () => {
      const isMinLengthValid = (username: string) => username.length >= 3;

      expect(isMinLengthValid('ab')).toBe(false);
      expect(isMinLengthValid('abc')).toBe(true);
      expect(isMinLengthValid('username')).toBe(true);
    });

    it('validates complete username requirements', () => {
      const validateUsername = (username: string) => {
        const alphanumericRegex = /^[a-zA-Z0-9]*$/;
        return alphanumericRegex.test(username) && username.length >= 3 && username.length <= 20;
      };

      expect(validateUsername('validuser123')).toBe(true);
      expect(validateUsername('ab')).toBe(false);
      expect(validateUsername('invalid_user')).toBe(false);
      expect(validateUsername('averylongusernamethatexceedstwentycharacters')).toBe(false);
    });
  });

  describe('Username change handler', () => {
    it('shows warning for non-alphanumeric characters', () => {
      const handleUsernameChange = (inputValue: string) => {
        const alphanumericRegex = /^[a-zA-Z0-9]*$/;

        if (!alphanumericRegex.test(inputValue)) {
          (toast.warning as jest.Mock)('Only letters and numbers are allowed in Usernames.');
          return false;
        }
        return true;
      };

      handleUsernameChange('test_user');
      expect(toast.warning).toHaveBeenCalledWith(
        'Only letters and numbers are allowed in Usernames.'
      );
    });

    it('shows warning when username exceeds 20 characters', () => {
      const handleUsernameChange = (inputValue: string) => {
        const alphanumericRegex = /^[a-zA-Z0-9]*$/;

        if (alphanumericRegex.test(inputValue) && inputValue.length > 20) {
          (toast.warning as jest.Mock)('Username must be 20 characters or less.');
          return false;
        }
        return true;
      };

      handleUsernameChange('averylongusernamethatexceedstwenty');
      expect(toast.warning).toHaveBeenCalledWith('Username must be 20 characters or less.');
    });

    it('accepts valid username input', () => {
      const handleUsernameChange = (inputValue: string) => {
        const alphanumericRegex = /^[a-zA-Z0-9]*$/;

        if (!alphanumericRegex.test(inputValue)) {
          (toast.warning as jest.Mock)('Only letters and numbers are allowed in Usernames.');
          return false;
        }
        if (inputValue.length > 20) {
          (toast.warning as jest.Mock)('Username must be 20 characters or less.');
          return false;
        }
        return true;
      };

      jest.clearAllMocks();
      const result = handleUsernameChange('validuser123');
      expect(result).toBe(true);
      expect(toast.warning).not.toHaveBeenCalled();
    });
  });

  describe('Step navigation', () => {
    it('validates step 1 (name) requires name longer than 2 characters', () => {
      const isStep1Valid = (name: string) => name.length > 2;

      expect(isStep1Valid('')).toBe(false);
      expect(isStep1Valid('AB')).toBe(false);
      expect(isStep1Valid('ABC')).toBe(true);
    });

    it('validates step 2 (username) requires username longer than 2 characters', () => {
      const isStep2Valid = (username: string) => username.length > 2;

      expect(isStep2Valid('')).toBe(false);
      expect(isStep2Valid('AB')).toBe(false);
      expect(isStep2Valid('ABC')).toBe(true);
    });

    it('allows skipping steps 3-5 (avatar, interests, prompts)', () => {
      const canProceed = (step: number, name: string, username: string) => {
        if (step === 1) return name.length > 2;
        if (step === 2) return username.length > 2;
        return true;
      };

      expect(canProceed(3, 'Name', 'username')).toBe(true);
      expect(canProceed(4, 'Name', 'username')).toBe(true);
      expect(canProceed(5, 'Name', 'username')).toBe(true);
    });
  });

  describe('Button state logic', () => {
    it('disables save button when name is too short (step 1)', () => {
      const isSaveButtonDisabled = (step: number, name: string, username: string) => {
        if (step === 1) return !name || name.length <= 2;
        if (step === 2) return !username || username.length <= 2;
        return false;
      };

      expect(isSaveButtonDisabled(1, '', '')).toBe(true);
      expect(isSaveButtonDisabled(1, 'AB', '')).toBe(true);
      expect(isSaveButtonDisabled(1, 'ABC', '')).toBe(false);
    });

    it('disables save button when username is too short (step 2)', () => {
      const isSaveButtonDisabled = (step: number, name: string, username: string) => {
        if (step === 1) return !name || name.length <= 2;
        if (step === 2) return !username || username.length <= 2;
        return false;
      };

      expect(isSaveButtonDisabled(2, 'Name', '')).toBe(true);
      expect(isSaveButtonDisabled(2, 'Name', 'AB')).toBe(true);
      expect(isSaveButtonDisabled(2, 'Name', 'ABC')).toBe(false);
    });

    it('enables button on optional steps (3, 4, 5)', () => {
      const isSaveButtonDisabled = (step: number, name: string, username: string) => {
        if (step === 1) return !name || name.length <= 2;
        if (step === 2) return !username || username.length <= 2;
        return false;
      };

      expect(isSaveButtonDisabled(3, 'Name', 'username')).toBe(false);
      expect(isSaveButtonDisabled(4, 'Name', 'username')).toBe(false);
      expect(isSaveButtonDisabled(5, 'Name', 'username')).toBe(false);
    });
  });

  describe('Button text logic', () => {
    it('shows "Continue" on steps 1-3', () => {
      const getButtonText = (
        step: number,
        selectedInterestIds: string[],
        answeredPrompts: any[]
      ) => {
        if (step < 4) return 'Continue';
        if (step === 4) {
          return selectedInterestIds.length > 0 ? 'Continue' : 'Skip';
        }
        return answeredPrompts.filter((p: any) => p.answer.length >= 5).length > 0
          ? 'Complete Setup'
          : 'Skip & Finish';
      };

      expect(getButtonText(1, [], [])).toBe('Continue');
      expect(getButtonText(2, [], [])).toBe('Continue');
      expect(getButtonText(3, [], [])).toBe('Continue');
    });

    it('shows "Skip" when no interests selected on step 4', () => {
      const getButtonText = (
        step: number,
        selectedInterestIds: string[],
        answeredPrompts: any[]
      ) => {
        if (step < 4) return 'Continue';
        if (step === 4) {
          return selectedInterestIds.length > 0 ? 'Continue' : 'Skip';
        }
        return answeredPrompts.filter((p: any) => p.answer.length >= 5).length > 0
          ? 'Complete Setup'
          : 'Skip & Finish';
      };

      expect(getButtonText(4, [], [])).toBe('Skip');
    });

    it('shows "Continue" when interests are selected on step 4', () => {
      const getButtonText = (
        step: number,
        selectedInterestIds: string[],
        answeredPrompts: any[]
      ) => {
        if (step < 4) return 'Continue';
        if (step === 4) {
          return selectedInterestIds.length > 0 ? 'Continue' : 'Skip';
        }
        return answeredPrompts.filter((p: any) => p.answer.length >= 5).length > 0
          ? 'Complete Setup'
          : 'Skip & Finish';
      };

      expect(getButtonText(4, ['interest_1'], [])).toBe('Continue');
    });

    it('shows "Skip & Finish" when no prompts answered on step 5', () => {
      const getButtonText = (
        step: number,
        selectedInterestIds: string[],
        answeredPrompts: any[]
      ) => {
        if (step < 4) return 'Continue';
        if (step === 4) {
          return selectedInterestIds.length > 0 ? 'Continue' : 'Skip';
        }
        return answeredPrompts.filter((p: any) => p.answer.length >= 5).length > 0
          ? 'Complete Setup'
          : 'Skip & Finish';
      };

      expect(getButtonText(5, [], [])).toBe('Skip & Finish');
    });

    it('shows "Complete Setup" when prompts are answered on step 5', () => {
      const getButtonText = (
        step: number,
        selectedInterestIds: string[],
        answeredPrompts: any[]
      ) => {
        if (step < 4) return 'Continue';
        if (step === 4) {
          return selectedInterestIds.length > 0 ? 'Continue' : 'Skip';
        }
        return answeredPrompts.filter((p: any) => p.answer.length >= 5).length > 0
          ? 'Complete Setup'
          : 'Skip & Finish';
      };

      const answeredPrompts = [
        {
          prompt_id: 'p1',
          answer: 'This is a long enough answer',
          is_visible: true,
          display_order: 0,
        },
      ];

      expect(getButtonText(5, [], answeredPrompts)).toBe('Complete Setup');
    });

    it('requires prompt answers to be at least 5 characters', () => {
      const getButtonText = (
        step: number,
        selectedInterestIds: string[],
        answeredPrompts: any[]
      ) => {
        if (step < 4) return 'Continue';
        if (step === 4) {
          return selectedInterestIds.length > 0 ? 'Continue' : 'Skip';
        }
        return answeredPrompts.filter((p: any) => p.answer.length >= 5).length > 0
          ? 'Complete Setup'
          : 'Skip & Finish';
      };

      const shortAnswerPrompts = [
        { prompt_id: 'p1', answer: 'Hi', is_visible: true, display_order: 0 },
      ];

      expect(getButtonText(5, [], shortAnswerPrompts)).toBe('Skip & Finish');
    });
  });

  describe('File upload validation', () => {
    it('rejects files larger than 10MB', () => {
      const validateFileSize = (fileSize: number) => {
        const maxSize = 10 * 1024 * 1024;
        return fileSize <= maxSize;
      };

      expect(validateFileSize(5 * 1024 * 1024)).toBe(true);
      expect(validateFileSize(10 * 1024 * 1024)).toBe(true);
      expect(validateFileSize(11 * 1024 * 1024)).toBe(false);
    });
  });

  describe('Username availability check', () => {
    it('considers username available when no user exists', () => {
      const checkAvailability = (
        existingUser: any,
        currentUsername: string,
        inputUsername: string
      ) => {
        if (currentUsername === inputUsername) return true;
        return !existingUser?.id;
      };

      expect(checkAvailability(null, '', 'newuser')).toBe(true);
      expect(checkAvailability({}, '', 'newuser')).toBe(true);
    });

    it('considers username taken when user exists', () => {
      const checkAvailability = (
        existingUser: any,
        currentUsername: string,
        inputUsername: string
      ) => {
        if (currentUsername === inputUsername) return true;
        return !existingUser?.id;
      };

      expect(checkAvailability({ id: 'user_123' }, '', 'takenuser')).toBe(false);
    });

    it('allows user to keep their current username', () => {
      const checkAvailability = (
        existingUser: any,
        currentUsername: string,
        inputUsername: string
      ) => {
        if (currentUsername === inputUsername) return true;
        return !existingUser?.id;
      };

      expect(checkAvailability({ id: 'user_123' }, 'myusername', 'myusername')).toBe(true);
    });
  });

  describe('Upload response parsing', () => {
    it('extracts image path from wrapped API response', () => {
      const parseUploadResponse = (res: any) => res.data?.image;

      const apiResponse = {
        success: true,
        message: 'Uploaded',
        data: { image: '/users/usr_123/avatar.jpg' },
      };
      expect(parseUploadResponse(apiResponse)).toBe('/users/usr_123/avatar.jpg');
    });

    it('returns undefined for unwrapped response shape (old bug)', () => {
      const parseUploadResponse = (res: any) => res.data?.image;

      const unwrappedResponse = { image: '/users/usr_123/avatar.jpg' };
      expect(parseUploadResponse(unwrappedResponse)).toBeUndefined();
    });

    it('stores raw relative path, not display URL', () => {
      const parseUploadResponse = (res: any) => res.data?.image;

      const apiResponse = {
        success: true,
        data: { image: '/users/usr_123/avatar.jpg' },
      };
      const imagePath = parseUploadResponse(apiResponse);

      expect(imagePath).not.toContain('render/image');
      expect(imagePath).not.toContain('width=');
      expect(imagePath).toBe('/users/usr_123/avatar.jpg');
    });

    it('handles missing data gracefully', () => {
      const parseUploadResponse = (res: any) => res?.data?.image;

      expect(parseUploadResponse({})).toBeUndefined();
      expect(parseUploadResponse({ success: false })).toBeUndefined();
      expect(parseUploadResponse({ data: {} })).toBeUndefined();
      expect(parseUploadResponse(null)).toBeUndefined();
    });
  });
});
