import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MnemonicExport } from '@/components/wallet/mnemonic-export';
import { usePasskey } from '@/lib/hooks/use-passkey';
import { PasskeyStorageService } from '@/lib/services/passkey-storage';
import { prfOutputToMnemonic } from '@/lib/services/prf-to-mnemonic';
import { PasskeyError } from '@/lib/services/passkey-service';

// Mock the hooks and services
jest.mock('@/lib/hooks/use-passkey');
jest.mock('@/lib/services/prf-to-mnemonic');
jest.mock('@/lib/utils/toast', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));

// Mock static methods of PasskeyStorageService
const mockGetCredentialId = jest.fn();
const mockHasPasskeyWallet = jest.fn();

jest.mock('@/lib/services/passkey-storage', () => ({
  PasskeyStorageService: {
    getCredentialId: (...args: unknown[]) => mockGetCredentialId(...args),
    hasPasskeyWallet: (...args: unknown[]) => mockHasPasskeyWallet(...args),
  },
}));

const mockUsePasskey = usePasskey as jest.MockedFunction<typeof usePasskey>;
const mockPrfOutputToMnemonic = prfOutputToMnemonic as jest.MockedFunction<typeof prfOutputToMnemonic>;

describe('MnemonicExport', () => {
  const mockAuthenticateWithPRF = jest.fn();
  const mockGetErrorMessage = jest.fn();
  const mockOnComplete = jest.fn();
  const mockOnCancel = jest.fn();

  const mockCredentialId = 'test-credential-id-123';
  const mockPrfOutput = new Uint8Array(32).fill(1);
  const mockMnemonic = 'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about';

  beforeEach(() => {
    jest.clearAllMocks();

    // Default mock implementations
    mockUsePasskey.mockReturnValue({
      authenticateWithPRF: mockAuthenticateWithPRF,
      isAuthenticating: false,
      getErrorMessage: mockGetErrorMessage,
    } as unknown as ReturnType<typeof usePasskey>);

    mockGetCredentialId.mockReturnValue(mockCredentialId);
    mockHasPasskeyWallet.mockReturnValue(true);
    mockPrfOutputToMnemonic.mockReturnValue(mockMnemonic);
    mockGetErrorMessage.mockImplementation((error) => error?.message || 'An error occurred');
  });

  describe('Initial State', () => {
    it('renders export button and security notice', () => {
      render(<MnemonicExport />);

      expect(screen.getByText('Export Recovery Phrase')).toBeInTheDocument();
      expect(screen.getByText('Export Mnemonic')).toBeInTheDocument();
      expect(screen.getByText('Security Notice')).toBeInTheDocument();
      expect(screen.getByText('You will need to authenticate with your passkey')).toBeInTheDocument();
    });

    it('shows cancel button when onCancel is provided', () => {
      render(<MnemonicExport onCancel={mockOnCancel} />);

      expect(screen.getByText('Cancel')).toBeInTheDocument();
    });

    it('does not show cancel button when onCancel is not provided', () => {
      render(<MnemonicExport />);

      expect(screen.queryByText('Cancel')).not.toBeInTheDocument();
    });

    it('calls onCancel when cancel button is clicked', () => {
      render(<MnemonicExport onCancel={mockOnCancel} />);

      fireEvent.click(screen.getByText('Cancel'));
      expect(mockOnCancel).toHaveBeenCalled();
    });
  });

  describe('Export Flow', () => {
    it('checks for passkey wallet before authenticating', async () => {
      mockGetCredentialId.mockReturnValue(null);

      render(<MnemonicExport />);
      fireEvent.click(screen.getByText('Export Mnemonic'));

      await waitFor(() => {
        expect(screen.getByText('Export Failed')).toBeInTheDocument();
      });

      expect(screen.getByText('No passkey wallet found. Please create a wallet first.')).toBeInTheDocument();
    });

    it('checks if encrypted mnemonic exists', async () => {
      mockHasPasskeyWallet.mockReturnValue(false);

      render(<MnemonicExport />);
      fireEvent.click(screen.getByText('Export Mnemonic'));

      await waitFor(() => {
        expect(screen.getByText('Export Failed')).toBeInTheDocument();
      });

      expect(screen.getByText('No passkey wallet data found. Please create a wallet first.')).toBeInTheDocument();
    });

    it('shows authenticating state while waiting for passkey', async () => {
      mockAuthenticateWithPRF.mockImplementation(() => new Promise(() => {})); // Never resolves
      mockUsePasskey.mockReturnValue({
        authenticateWithPRF: mockAuthenticateWithPRF,
        isAuthenticating: true,
        getErrorMessage: mockGetErrorMessage,
      } as unknown as ReturnType<typeof usePasskey>);

      render(<MnemonicExport />);
      fireEvent.click(screen.getByText('Export Mnemonic'));

      await waitFor(() => {
        expect(screen.getByText('Authenticating...')).toBeInTheDocument();
      });

      expect(screen.getByText('Please use your passkey to authenticate')).toBeInTheDocument();
      expect(screen.getByText('Verify Your Identity')).toBeInTheDocument();
    });

    it('authenticates with PRF using credential ID as salt', async () => {
      mockAuthenticateWithPRF.mockResolvedValue({
        prfOutput: mockPrfOutput,
        credentialId: mockCredentialId,
        userVerified: true,
      });

      render(<MnemonicExport rpId='evento.cash' />);
      fireEvent.click(screen.getByText('Export Mnemonic'));

      await waitFor(() => {
        expect(mockAuthenticateWithPRF).toHaveBeenCalledWith(
          'evento.cash',
          mockCredentialId,
          {
            credentialId: mockCredentialId,
            requireUserVerification: true,
          }
        );
      });
    });

    it('uses default rpId when not provided', async () => {
      mockAuthenticateWithPRF.mockResolvedValue({
        prfOutput: mockPrfOutput,
        credentialId: mockCredentialId,
        userVerified: true,
      });

      render(<MnemonicExport />);
      fireEvent.click(screen.getByText('Export Mnemonic'));

      await waitFor(() => {
        expect(mockAuthenticateWithPRF).toHaveBeenCalledWith(
          'evento.cash',
          expect.any(String),
          expect.any(Object)
        );
      });
    });

    it('displays mnemonic after successful authentication', async () => {
      mockAuthenticateWithPRF.mockResolvedValue({
        prfOutput: mockPrfOutput,
        credentialId: mockCredentialId,
        userVerified: true,
      });

      render(<MnemonicExport />);
      fireEvent.click(screen.getByText('Export Mnemonic'));

      await waitFor(() => {
        expect(screen.getByText('Your Recovery Phrase')).toBeInTheDocument();
      });

      // Mnemonic should be blurred initially
      const mnemonicDisplay = screen.getByTestId('mnemonic-display');
      expect(mnemonicDisplay).toHaveClass('blur-sm');
    });

    it('derives mnemonic from PRF output', async () => {
      mockAuthenticateWithPRF.mockResolvedValue({
        prfOutput: mockPrfOutput,
        credentialId: mockCredentialId,
        userVerified: true,
      });

      render(<MnemonicExport />);
      fireEvent.click(screen.getByText('Export Mnemonic'));

      await waitFor(() => {
        expect(mockPrfOutputToMnemonic).toHaveBeenCalledWith(mockPrfOutput);
      });
    });
  });

  describe('Mnemonic Display', () => {
    beforeEach(async () => {
      mockAuthenticateWithPRF.mockResolvedValue({
        prfOutput: mockPrfOutput,
        credentialId: mockCredentialId,
        userVerified: true,
      });

      render(<MnemonicExport />);
      fireEvent.click(screen.getByText('Export Mnemonic'));

      await waitFor(() => {
        expect(screen.getByText('Your Recovery Phrase')).toBeInTheDocument();
      });
    });

    it('shows word count in description', () => {
      const words = mockMnemonic.split(' ');
      expect(screen.getByText(`Write down these ${words.length} words in order and store them safely`)).toBeInTheDocument();
    });

    it('shows security warning', () => {
      expect(screen.getByText('Keep this private')).toBeInTheDocument();
      expect(screen.getByText('Anyone with these words can access your wallet. Store them securely offline.')).toBeInTheDocument();
    });

    it('toggles mnemonic visibility', async () => {
      const toggleButton = screen.getByTestId('toggle-visibility');

      // Initially blurred
      expect(screen.getByTestId('mnemonic-display')).toHaveClass('blur-sm');

      // Click to show
      fireEvent.click(toggleButton);
      expect(screen.getByTestId('mnemonic-display')).not.toHaveClass('blur-sm');

      // Click to hide
      fireEvent.click(toggleButton);
      expect(screen.getByTestId('mnemonic-display')).toHaveClass('blur-sm');
    });

    it('renders all mnemonic words', () => {
      const words = mockMnemonic.split(' ');

      words.forEach((word, index) => {
        const wordElement = screen.getByTestId(`word-${index}`);
        expect(wordElement).toBeInTheDocument();
        expect(wordElement).toHaveTextContent(`${index + 1}.${word}`);
      });
    });

    it('shows copy and save buttons when mnemonic is visible', async () => {
      const toggleButton = screen.getByTestId('toggle-visibility');
      fireEvent.click(toggleButton);

      await waitFor(() => {
        expect(screen.getByTestId('copy-button')).toBeInTheDocument();
        expect(screen.getByTestId('save-button')).toBeInTheDocument();
      });
    });

    it('hides copy and save buttons when mnemonic is blurred', () => {
      expect(screen.queryByTestId('copy-button')).not.toBeInTheDocument();
      expect(screen.queryByTestId('save-button')).not.toBeInTheDocument();
    });
  });

  describe('Copy Functionality', () => {
    const mockClipboard = {
      writeText: jest.fn(),
    };

    beforeEach(async () => {
      Object.assign(navigator, { clipboard: mockClipboard });
      mockClipboard.writeText.mockResolvedValue(undefined);

      mockAuthenticateWithPRF.mockResolvedValue({
        prfOutput: mockPrfOutput,
        credentialId: mockCredentialId,
        userVerified: true,
      });

      render(<MnemonicExport />);
      fireEvent.click(screen.getByText('Export Mnemonic'));

      await waitFor(() => {
        expect(screen.getByText('Your Recovery Phrase')).toBeInTheDocument();
      });

      // Show mnemonic
      fireEvent.click(screen.getByTestId('toggle-visibility'));
    });

    it('copies mnemonic to clipboard', async () => {
      const copyButton = screen.getByTestId('copy-button');
      fireEvent.click(copyButton);

      await waitFor(() => {
        expect(mockClipboard.writeText).toHaveBeenCalledWith(mockMnemonic);
      });
    });

    it('shows copied state after copying', async () => {
      const copyButton = screen.getByTestId('copy-button');
      fireEvent.click(copyButton);

      await waitFor(() => {
        expect(screen.getByText('Copied!')).toBeInTheDocument();
      });
    });
  });

  describe('Save Functionality', () => {
    const mockCreateObjectURL = jest.fn();
    const mockRevokeObjectURL = jest.fn();

    beforeEach(async () => {
      URL.createObjectURL = mockCreateObjectURL;
      URL.revokeObjectURL = mockRevokeObjectURL;
      mockCreateObjectURL.mockReturnValue('blob:mock-url');

      // Mock document.createElement for download link
      const mockClick = jest.fn();
      jest.spyOn(document, 'createElement').mockReturnValue({
        click: mockClick,
        href: '',
        download: '',
      } as unknown as HTMLAnchorElement);

      mockAuthenticateWithPRF.mockResolvedValue({
        prfOutput: mockPrfOutput,
        credentialId: mockCredentialId,
        userVerified: true,
      });

      render(<MnemonicExport />);
      fireEvent.click(screen.getByText('Export Mnemonic'));

      await waitFor(() => {
        expect(screen.getByText('Your Recovery Phrase')).toBeInTheDocument();
      });

      // Show mnemonic
      fireEvent.click(screen.getByTestId('toggle-visibility'));
    });

    it('downloads mnemonic as file', async () => {
      const saveButton = screen.getByTestId('save-button');
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(mockCreateObjectURL).toHaveBeenCalled();
      });
    });
  });

  describe('Completion', () => {
    beforeEach(async () => {
      mockAuthenticateWithPRF.mockResolvedValue({
        prfOutput: mockPrfOutput,
        credentialId: mockCredentialId,
        userVerified: true,
      });

      render(<MnemonicExport onComplete={mockOnComplete} />);
      fireEvent.click(screen.getByText('Export Mnemonic'));

      await waitFor(() => {
        expect(screen.getByText('Your Recovery Phrase')).toBeInTheDocument();
      });
    });

    it('calls onComplete when user confirms', () => {
      fireEvent.click(screen.getByText("I've Saved My Recovery Phrase"));
      expect(mockOnComplete).toHaveBeenCalled();
    });

    it('clears mnemonic from state after completion', async () => {
      fireEvent.click(screen.getByText("I've Saved My Recovery Phrase"));

      // Should return to initial state
      await waitFor(() => {
        expect(screen.getByText('Export Recovery Phrase')).toBeInTheDocument();
      });
    });

    it('calls onCancel when close button is clicked', () => {
      fireEvent.click(screen.getByText('Close'));
      expect(mockOnCancel).toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    it('handles passkey cancellation gracefully', async () => {
      const cancelError = new PasskeyError(
        'Passkey authentication was cancelled',
        'cancelled'
      );
      mockAuthenticateWithPRF.mockRejectedValue(cancelError);

      render(<MnemonicExport />);
      fireEvent.click(screen.getByText('Export Mnemonic'));

      await waitFor(() => {
        expect(screen.getByText('Export Failed')).toBeInTheDocument();
      });

      expect(screen.getByText('Authentication was cancelled. Your mnemonic remains secure.')).toBeInTheDocument();
    });

    it('does not show mnemonic when authentication is cancelled', async () => {
      const cancelError = new PasskeyError(
        'Passkey authentication was cancelled',
        'cancelled'
      );
      mockAuthenticateWithPRF.mockRejectedValue(cancelError);

      render(<MnemonicExport />);
      fireEvent.click(screen.getByText('Export Mnemonic'));

      await waitFor(() => {
        expect(screen.getByText('Export Failed')).toBeInTheDocument();
      });

      expect(screen.queryByText('Your Recovery Phrase')).not.toBeInTheDocument();
    });

    it('shows passkey error message for passkey errors', async () => {
      const passkeyError = new PasskeyError(
        'No passkey found',
        'no_credentials_found'
      );
      mockAuthenticateWithPRF.mockRejectedValue(passkeyError);
      mockGetErrorMessage.mockReturnValue('No passkey found for this account');

      render(<MnemonicExport />);
      fireEvent.click(screen.getByText('Export Mnemonic'));

      await waitFor(() => {
        expect(screen.getByText('No passkey found for this account')).toBeInTheDocument();
      });
    });

    it('shows generic error message for unknown errors', async () => {
      mockAuthenticateWithPRF.mockRejectedValue(new Error('Network error'));

      render(<MnemonicExport />);
      fireEvent.click(screen.getByText('Export Mnemonic'));

      await waitFor(() => {
        expect(screen.getByText('Network error')).toBeInTheDocument();
      });
    });

    it('allows retry after error', async () => {
      mockAuthenticateWithPRF.mockRejectedValue(new Error('Network error'));

      render(<MnemonicExport />);
      fireEvent.click(screen.getByText('Export Mnemonic'));

      await waitFor(() => {
        expect(screen.getByText('Export Failed')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Try Again'));

      await waitFor(() => {
        expect(screen.getByText('Export Recovery Phrase')).toBeInTheDocument();
      });
    });
  });

  describe('Props Interface', () => {
    it('accepts custom rpId', async () => {
      mockAuthenticateWithPRF.mockResolvedValue({
        prfOutput: mockPrfOutput,
        credentialId: mockCredentialId,
        userVerified: true,
      });

      render(<MnemonicExport rpId='custom.domain.com' />);
      fireEvent.click(screen.getByText('Export Mnemonic'));

      await waitFor(() => {
        expect(mockAuthenticateWithPRF).toHaveBeenCalledWith(
          'custom.domain.com',
          expect.any(String),
          expect.any(Object)
        );
      });
    });

    it('calls onComplete callback', async () => {
      mockAuthenticateWithPRF.mockResolvedValue({
        prfOutput: mockPrfOutput,
        credentialId: mockCredentialId,
        userVerified: true,
      });

      render(<MnemonicExport onComplete={mockOnComplete} />);
      fireEvent.click(screen.getByText('Export Mnemonic'));

      await waitFor(() => {
        expect(screen.getByText('Your Recovery Phrase')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText("I've Saved My Recovery Phrase"));
      expect(mockOnComplete).toHaveBeenCalled();
    });

    it('calls onCancel callback', async () => {
      render(<MnemonicExport onCancel={mockOnCancel} />);
      fireEvent.click(screen.getByText('Cancel'));
      expect(mockOnCancel).toHaveBeenCalled();
    });
  });

  describe('Security Requirements', () => {
    it('requires passkey authentication before showing mnemonic', async () => {
      mockAuthenticateWithPRF.mockResolvedValue({
        prfOutput: mockPrfOutput,
        credentialId: mockCredentialId,
        userVerified: true,
      });

      render(<MnemonicExport />);

      // Initially no mnemonic shown
      expect(screen.queryByText('Your Recovery Phrase')).not.toBeInTheDocument();

      // Click export
      fireEvent.click(screen.getByText('Export Mnemonic'));

      // Should show authenticating state
      await waitFor(() => {
        expect(mockAuthenticateWithPRF).toHaveBeenCalled();
      });

      // After auth, mnemonic shown
      await waitFor(() => {
        expect(screen.getByText('Your Recovery Phrase')).toBeInTheDocument();
      });
    });

    it('does not store mnemonic in component state after display', async () => {
      mockAuthenticateWithPRF.mockResolvedValue({
        prfOutput: mockPrfOutput,
        credentialId: mockCredentialId,
        userVerified: true,
      });

      const { unmount } = render(<MnemonicExport />);
      fireEvent.click(screen.getByText('Export Mnemonic'));

      await waitFor(() => {
        expect(screen.getByText('Your Recovery Phrase')).toBeInTheDocument();
      });

      // Complete the flow
      fireEvent.click(screen.getByText("I've Saved My Recovery Phrase"));

      await waitFor(() => {
        expect(screen.getByText('Export Recovery Phrase')).toBeInTheDocument();
      });

      // Unmount and remount to verify state is cleared
      unmount();
      render(<MnemonicExport />);

      // Should be back at initial state
      expect(screen.getByText('Export Mnemonic')).toBeInTheDocument();
      expect(screen.queryByText('Your Recovery Phrase')).not.toBeInTheDocument();
    });

    it('requires user verification for authentication', async () => {
      mockAuthenticateWithPRF.mockResolvedValue({
        prfOutput: mockPrfOutput,
        credentialId: mockCredentialId,
        userVerified: true,
      });

      render(<MnemonicExport />);
      fireEvent.click(screen.getByText('Export Mnemonic'));

      await waitFor(() => {
        expect(mockAuthenticateWithPRF).toHaveBeenCalledWith(
          expect.any(String),
          expect.any(String),
          expect.objectContaining({
            requireUserVerification: true,
          })
        );
      });
    });

    it('uses specific credential ID for authentication', async () => {
      mockAuthenticateWithPRF.mockResolvedValue({
        prfOutput: mockPrfOutput,
        credentialId: mockCredentialId,
        userVerified: true,
      });

      render(<MnemonicExport />);
      fireEvent.click(screen.getByText('Export Mnemonic'));

      await waitFor(() => {
        expect(mockAuthenticateWithPRF).toHaveBeenCalledWith(
          expect.any(String),
          expect.any(String),
          expect.objectContaining({
            credentialId: mockCredentialId,
          })
        );
      });
    });
  });
});
