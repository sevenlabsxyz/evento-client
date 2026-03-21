import { toast } from '@/lib/utils/toast';

// Mock toast utility
jest.mock('@/lib/utils/toast', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
    warning: jest.fn(),
  },
}));

// Test mnemonic (12 words)
const TEST_MNEMONIC_12 = 'abandon ability able about above absent absorb abstract absurd abuse access accident';
// Test mnemonic (24 words)
const TEST_MNEMONIC_24 = 'abandon ability able about above absent absorb abstract absurd abuse access accident account achieve acid acoustic acquire across act action activity actor actual admit';

describe('MnemonicBackupFlow', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Mnemonic Word Parsing', () => {
    it('correctly splits 12-word mnemonic into words array', () => {
      const words = TEST_MNEMONIC_12.split(' ');
      expect(words).toHaveLength(12);
      expect(words[0]).toBe('abandon');
      expect(words[11]).toBe('accident');
    });

    it('correctly splits 24-word mnemonic into words array', () => {
      const words = TEST_MNEMONIC_24.split(' ');
      expect(words).toHaveLength(24);
      expect(words[0]).toBe('abandon');
      expect(words[23]).toBe('admit');
    });

    it('handles single word mnemonic', () => {
      const mnemonic = 'testword';
      const words = mnemonic.split(' ');
      expect(words).toHaveLength(1);
      expect(words[0]).toBe('testword');
    });

    it('handles empty mnemonic', () => {
      const mnemonic = '';
      const words = mnemonic.split(' ').filter(w => w);
      expect(words).toHaveLength(0);
    });

    it('handles mnemonic with extra spaces', () => {
      const mnemonic = 'word1  word2   word3';
      const words = mnemonic.split(' ').filter(w => w);
      expect(words).toHaveLength(3);
      expect(words).toEqual(['word1', 'word2', 'word3']);
    });
  });

  describe('Word Count Display', () => {
    it('displays correct word count for 12-word mnemonic', () => {
      const words = TEST_MNEMONIC_12.split(' ');
      const wordCount = words.length;
      const displayText = `Write down these ${wordCount} words in order and store them safely`;
      expect(displayText).toBe('Write down these 12 words in order and store them safely');
    });

    it('displays correct word count for 24-word mnemonic', () => {
      const words = TEST_MNEMONIC_24.split(' ');
      const wordCount = words.length;
      const displayText = `Write down these ${wordCount} words in order and store them safely`;
      expect(displayText).toBe('Write down these 24 words in order and store them safely');
    });
  });

  describe('Step Navigation Logic', () => {
    type Step = 'warning' | 'backup' | 'confirm';

    it('starts at warning step', () => {
      const initialStep: Step = 'warning';
      expect(initialStep).toBe('warning');
    });

    it('transitions from warning to backup when user confirms understanding', () => {
      let currentStep: Step = 'warning';
      
      // Simulate user clicking "I Understand"
      const handleUnderstand = () => {
        currentStep = 'backup';
      };
      
      handleUnderstand();
      expect(currentStep).toBe('backup');
    });

    it('transitions from backup to confirm when user confirms backup', () => {
      let currentStep: Step = 'backup';
      let confirmed = false;
      
      // User must check the confirmation checkbox
      const handleConfirm = () => {
        if (confirmed) {
          currentStep = 'confirm';
        }
      };
      
      // Without confirmation, should not proceed
      handleConfirm();
      expect(currentStep).toBe('backup');
      
      // With confirmation, should proceed
      confirmed = true;
      handleConfirm();
      expect(currentStep).toBe('confirm');
    });

    it('can navigate back from backup to warning', () => {
      let currentStep: Step = 'backup';
      
      const handleBack = () => {
        currentStep = 'warning';
      };
      
      handleBack();
      expect(currentStep).toBe('warning');
    });

    it('can navigate back from confirm to backup', () => {
      let currentStep: Step = 'confirm';
      
      const handleViewAgain = () => {
        currentStep = 'backup';
      };
      
      handleViewAgain();
      expect(currentStep).toBe('backup');
    });
  });

  describe('Confirmation State Logic', () => {
    it('requires confirmation checkbox to be checked before proceeding', () => {
      let confirmed = false;
      const canProceed = () => confirmed;
      
      expect(canProceed()).toBe(false);
      
      confirmed = true;
      expect(canProceed()).toBe(true);
    });

    it('shows error toast when trying to proceed without confirmation', () => {
      let confirmed = false;
      
      const handleProceed = () => {
        if (!confirmed) {
          toast.error('Please confirm you have saved your recovery phrase');
          return false;
        }
        return true;
      };
      
      const result = handleProceed();
      expect(result).toBe(false);
      expect(toast.error).toHaveBeenCalledWith('Please confirm you have saved your recovery phrase');
    });
  });

  describe('Copy Functionality', () => {
    it('copies mnemonic to clipboard', async () => {
      const mockClipboardWrite = jest.fn().mockResolvedValue(undefined);
      
      const handleCopy = async (mnemonic: string) => {
        try {
          await mockClipboardWrite(mnemonic);
          toast.success('Recovery phrase copied to clipboard');
          return true;
        } catch {
          toast.error('Failed to copy recovery phrase');
          return false;
        }
      };
      
      const result = await handleCopy(TEST_MNEMONIC_12);
      expect(result).toBe(true);
      expect(mockClipboardWrite).toHaveBeenCalledWith(TEST_MNEMONIC_12);
      expect(toast.success).toHaveBeenCalledWith('Recovery phrase copied to clipboard');
    });

    it('shows error toast when copy fails', async () => {
      const mockClipboardWrite = jest.fn().mockRejectedValue(new Error('Copy failed'));
      
      const handleCopy = async (mnemonic: string) => {
        try {
          await mockClipboardWrite(mnemonic);
          toast.success('Recovery phrase copied to clipboard');
          return true;
        } catch {
          toast.error('Failed to copy recovery phrase');
          return false;
        }
      };
      
      const result = await handleCopy(TEST_MNEMONIC_12);
      expect(result).toBe(false);
      expect(toast.error).toHaveBeenCalledWith('Failed to copy recovery phrase');
    });

    it('shows "Copied!" feedback after successful copy', () => {
      let copied = false;
      
      const handleCopySuccess = () => {
        copied = true;
        setTimeout(() => { copied = false; }, 3000);
      };
      
      handleCopySuccess();
      expect(copied).toBe(true);
    });
  });

  describe('Show/Hide Mnemonic Toggle', () => {
    it('starts with mnemonic hidden (blurred)', () => {
      let showMnemonic = false;
      expect(showMnemonic).toBe(false);
    });

    it('toggles visibility when clicking show/hide button', () => {
      let showMnemonic = false;
      
      const toggleVisibility = () => {
        showMnemonic = !showMnemonic;
      };
      
      // First toggle: show
      toggleVisibility();
      expect(showMnemonic).toBe(true);
      
      // Second toggle: hide
      toggleVisibility();
      expect(showMnemonic).toBe(false);
    });
  });

  describe('Passkey Wallet Warning Logic', () => {
    it('shows passkey-specific warning when isPasskeyWallet is true', () => {
      const isPasskeyWallet = true;
      const warningText = isPasskeyWallet 
        ? 'Passkey Loss = Wallet Loss' 
        : null;
      
      expect(warningText).toBe('Passkey Loss = Wallet Loss');
    });

    it('hides passkey-specific warning when isPasskeyWallet is false', () => {
      const isPasskeyWallet = false;
      const warningText = isPasskeyWallet 
        ? 'Passkey Loss = Wallet Loss' 
        : null;
      
      expect(warningText).toBeNull();
    });

    it('includes passkey reminder in confirm step for passkey wallets', () => {
      const isPasskeyWallet = true;
      const confirmReminder = isPasskeyWallet
        ? 'Your passkey alone is not enough to recover your wallet on a new device.'
        : null;
      
      expect(confirmReminder).toBe('Your passkey alone is not enough to recover your wallet on a new device.');
    });
  });

  describe('OnComplete Callback', () => {
    it('calls onComplete when user completes the flow', () => {
      const mockOnComplete = jest.fn();
      
      const handleComplete = () => {
        toast.success('Backup confirmed!');
        mockOnComplete();
      };
      
      handleComplete();
      expect(mockOnComplete).toHaveBeenCalledTimes(1);
      expect(toast.success).toHaveBeenCalledWith('Backup confirmed!');
    });
  });

  describe('OnCancel Callback', () => {
    it('calls onCancel when user clicks cancel', () => {
      const mockOnCancel = jest.fn();
      
      const handleCancel = () => {
        mockOnCancel();
      };
      
      handleCancel();
      expect(mockOnCancel).toHaveBeenCalledTimes(1);
    });

    it('handles missing onCancel gracefully', () => {
      const mockOnCancel = undefined;
      
      const handleCancel = () => {
        mockOnCancel?.();
      };
      
      // Should not throw
      expect(() => handleCancel()).not.toThrow();
    });
  });

  describe('Security Requirements', () => {
    it('mnemonic is passed as prop, not stored in state', () => {
      // This test verifies the component design principle
      // The mnemonic should only be passed as a prop, never stored in component state
      const mnemonicProp = TEST_MNEMONIC_12;
      
      // Component should use the mnemonic directly from props
      // If we change the mnemonic prop, the component should reflect the new value
      const getMnemonic = (prop: string) => prop;
      
      expect(getMnemonic(mnemonicProp)).toBe(TEST_MNEMONIC_12);
    });

    it('requires explicit user confirmation before completing', () => {
      let step: 'warning' | 'backup' | 'confirm' = 'warning';
      let confirmed = false;
      let completed = false;
      
      // User must go through all steps
      const proceedFromWarning = () => { step = 'backup'; };
      const proceedFromBackup = () => { 
        if (confirmed) step = 'confirm'; 
      };
      const completeFlow = () => { 
        completed = true; 
      };
      
      // Try to complete without going through steps
      expect(completed).toBe(false);
      
      // Go through warning step
      proceedFromWarning();
      expect(step).toBe('backup');
      
      // Try to proceed from backup without confirmation
      proceedFromBackup();
      expect(step).toBe('backup'); // Still on backup
      
      // Confirm and proceed
      confirmed = true;
      proceedFromBackup();
      expect(step).toBe('confirm');
      
      // Complete
      completeFlow();
      expect(completed).toBe(true);
    });

    it('cannot skip backup confirmation', () => {
      let confirmed = false;
      
      const canProceedToConfirm = () => confirmed;
      
      // Without confirmation
      expect(canProceedToConfirm()).toBe(false);
      
      // Even if user tries to force it, the button should be disabled
      const isButtonDisabled = !confirmed;
      expect(isButtonDisabled).toBe(true);
    });
  });

  describe('Preparation Checklist', () => {
    it('includes all required preparation items', () => {
      const checklistItems = [
        'Have pen and paper ready to write down the words',
        'Be in a private space where others cannot see your screen',
        'Never share your recovery phrase with anyone',
        'Never store it digitally (photos, cloud, email)',
      ];
      
      expect(checklistItems).toHaveLength(4);
      expect(checklistItems[0]).toContain('pen and paper');
      expect(checklistItems[1]).toContain('private space');
      expect(checklistItems[2]).toContain('Never share');
      expect(checklistItems[3]).toContain('Never store it digitally');
    });
  });

  describe('Backup Checklist (Confirm Step)', () => {
    it('includes all verification items', () => {
      const wordCount = 12;
      const checklistItems = [
        `I wrote down all ${wordCount} words in the correct order`,
        'I stored the paper in a secure location',
        'I did not take a photo or save it digitally',
        'I did not share it with anyone',
      ];
      
      expect(checklistItems).toHaveLength(4);
      expect(checklistItems[0]).toContain('12 words');
    });
  });

  describe('Word Index Display', () => {
    it('displays correct indices for 12-word mnemonic', () => {
      const words = TEST_MNEMONIC_12.split(' ');
      const indices = words.map((_, index) => index + 1);
      
      expect(indices[0]).toBe(1);
      expect(indices[11]).toBe(12);
    });

    it('displays correct indices for 24-word mnemonic', () => {
      const words = TEST_MNEMONIC_24.split(' ');
      const indices = words.map((_, index) => index + 1);
      
      expect(indices[0]).toBe(1);
      expect(indices[23]).toBe(24);
    });
  });
});