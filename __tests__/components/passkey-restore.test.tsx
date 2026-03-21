import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { PasskeyRestore } from '@/components/wallet/passkey-restore';
import { usePasskey } from '@/lib/hooks/use-passkey';
import { PasskeyStorageService } from '@/lib/services/passkey-storage';
import { prfOutputToMnemonic } from '@/lib/services/prf-to-mnemonic';
import { PasskeyError } from '@/lib/services/passkey-service';

// Mock the hooks and services
jest.mock('@/lib/hooks/use-passkey');
jest.mock('@/lib/services/passkey-storage');
jest.mock('@/lib/services/prf-to-mnemonic');
jest.mock('@/lib/utils/toast', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));

const mockUsePasskey = usePasskey as jest.MockedFunction<typeof usePasskey>;
const mockPrfOutputToMnemonic = prfOutputToMnemonic as jest.MockedFunction<typeof prfOutputToMnemonic>;
const mockGetCredentialId = PasskeyStorageService.getCredentialId as jest.MockedFunction<
  typeof PasskeyStorageService.getCredentialId
>;
const mockHasPasskeyWallet = PasskeyStorageService.hasPasskeyWallet as jest.MockedFunction<
  typeof PasskeyStorageService.hasPasskeyWallet
>;

describe('PasskeyRestore', () => {
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
    it('renders restore button and instructions', () => {
      render(<PasskeyRestore onComplete={mockOnComplete} />);

      expect(screen.getByText('Restore with Passkey')).toBeInTheDocument();
      expect(screen.getByText('Restore with Passkey')).toBeInTheDocument();
      expect(screen.getByText('Use your device\'s passkey to quickly restore your wallet.')).toBeInTheDocument();
    });

    it('shows cancel button when onCancel is provided', () => {
      render(<PasskeyRestore onComplete={mockOnComplete} onCancel={mockOnCancel} />);

      expect(screen.getByText('Cancel')).toBeInTheDocument();
    });

    it('does not show cancel button when onCancel is not provided', () => {
      render(<PasskeyRestore onComplete={mockOnComplete} />);

      expect(screen.queryByText('Cancel')).not.toBeInTheDocument();
    });

    it('calls onCancel when cancel button is clicked', () => {
      render(<PasskeyRestore onComplete={mockOnComplete} onCancel={mockOnCancel} />);

      fireEvent.click(screen.getByText('Cancel'));
      expect(mockOnCancel).toHaveBeenCalled();
    });

    it('shows important notice about same-device requirement', () => {
      render(<PasskeyRestore onComplete={mockOnComplete} />);

      expect(screen.getByText('Important')).toBeInTheDocument();
      expect(
        screen.getByText(/Passkey restore only works on the same device where you created your wallet/)
      ).toBeInTheDocument();
    });
  });

  describe('Restore Flow', () => {
    it('checks for passkey wallet before authenticating', async () => {
      mockGetCredentialId.mockReturnValue(null);

      render(<PasskeyRestore onComplete={mockOnComplete} />);
      fireEvent.click(screen.getByText('Restore with Passkey'));

      await waitFor(() => {
        expect(screen.getByText('Restore Failed')).toBeInTheDocument();
      });

      expect(
        screen.getByText(/No passkey found on this device. If you created your wallet on a different device/)
      ).toBeInTheDocument();
    });

    it('checks if encrypted mnemonic exists', async () => {
      mockHasPasskeyWallet.mockReturnValue(false);

      render(<PasskeyRestore onComplete={mockOnComplete} />);
      fireEvent.click(screen.getByText('Restore with Passkey'));

      await waitFor(() => {
        expect(screen.getByText('Restore Failed')).toBeInTheDocument();
      });

      expect(
        screen.getByText(/No passkey found on this device. If you created your wallet on a different device/)
      ).toBeInTheDocument();
    });

    it('shows authenticating state while waiting for passkey', async () => {
      mockAuthenticateWithPRF.mockImplementation(() => new Promise(() => {})); // Never resolves
      mockUsePasskey.mockReturnValue({
        authenticateWithPRF: mockAuthenticateWithPRF,
        isAuthenticating: true,
        getErrorMessage: mockGetErrorMessage,
      } as unknown as ReturnType<typeof usePasskey>);

      render(<PasskeyRestore onComplete={mockOnComplete} />);
      fireEvent.click(screen.getByText('Restore with Passkey'));

      await waitFor(() => {
        expect(screen.getByText('Authenticating...')).toBeInTheDocument();
      });

      expect(screen.getByText('Verify Your Identity')).toBeInTheDocument();
      expect(screen.getByText('Please use your passkey to authenticate and restore your wallet.')).toBeInTheDocument();
    });

    it('authenticates with PRF using credential ID as salt', async () => {
      mockAuthenticateWithPRF.mockResolvedValue({
        prfOutput: mockPrfOutput,
        credentialId: mockCredentialId,
        userVerified: true,
      });

      render(<PasskeyRestore onComplete={mockOnComplete} rpId='evento.cash' />);
      fireEvent.click(screen.getByText('Restore with Passkey'));

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

      render(<PasskeyRestore onComplete={mockOnComplete} />);
      fireEvent.click(screen.getByText('Restore with Passkey'));

      await waitFor(() => {
        expect(mockAuthenticateWithPRF).toHaveBeenCalledWith(
          'evento.cash',
          expect.any(String),
          expect.any(Object)
        );
      });
    });

    it('shows restoring state while processing', async () => {
      mockAuthenticateWithPRF.mockResolvedValue({
        prfOutput: mockPrfOutput,
        credentialId: mockCredentialId,
        userVerified: true,
      });

      render(<PasskeyRestore onComplete={mockOnComplete} />);
      fireEvent.click(screen.getByText('Restore with Passkey'));

      await waitFor(() => {
        expect(screen.getByText('Restoring Wallet...')).toBeInTheDocument();
      });

      expect(screen.getByText('Deriving your wallet keys from your passkey...')).toBeInTheDocument();
    });

    it('derives mnemonic from PRF output', async () => {
      mockAuthenticateWithPRF.mockResolvedValue({
        prfOutput: mockPrfOutput,
        credentialId: mockCredentialId,
        userVerified: true,
      });

      render(<PasskeyRestore onComplete={mockOnComplete} />);
      fireEvent.click(screen.getByText('Restore with Passkey'));

      await waitFor(() => {
        expect(mockPrfOutputToMnemonic).toHaveBeenCalledWith(mockPrfOutput);
      });
    });

    it('calls onComplete with mnemonic after successful restore', async () => {
      mockAuthenticateWithPRF.mockResolvedValue({
        prfOutput: mockPrfOutput,
        credentialId: mockCredentialId,
        userVerified: true,
      });

      render(<PasskeyRestore onComplete={mockOnComplete} />);
      fireEvent.click(screen.getByText('Restore with Passkey'));

      await waitFor(() => {
        expect(mockOnComplete).toHaveBeenCalledWith(mockMnemonic);
      });
    });
  });

  describe('Error Handling', () => {
    it('handles passkey cancellation gracefully', async () => {
      mockAuthenticateWithPRF.mockRejectedValue(
        new PasskeyError('Authentication was cancelled', 'cancelled')
      );

      render(<PasskeyRestore onComplete={mockOnComplete} />);
      fireEvent.click(screen.getByText('Restore with Passkey'));

      await waitFor(() => {
        expect(screen.getByText('Restore Failed')).toBeInTheDocument();
      });

      expect(screen.getByText('Authentication was cancelled. Please try again when you are ready.')).toBeInTheDocument();
    });

    it('handles no credentials found error (cross-device scenario)', async () => {
      mockAuthenticateWithPRF.mockRejectedValue(
        new PasskeyError('No passkey found', 'no_credentials_found')
      );

      render(<PasskeyRestore onComplete={mockOnComplete} />);
      fireEvent.click(screen.getByText('Restore with Passkey'));

      await waitFor(() => {
        expect(screen.getByText('Restore Failed')).toBeInTheDocument();
      });

      expect(
        screen.getByText(/No passkey found on this device. If you created your wallet on a different device/)
      ).toBeInTheDocument();
    });

    it('handles PRF not supported error', async () => {
      mockAuthenticateWithPRF.mockRejectedValue(
        new PasskeyError('PRF not supported', 'prf_not_supported')
      );

      render(<PasskeyRestore onComplete={mockOnComplete} />);
      fireEvent.click(screen.getByText('Restore with Passkey'));

      await waitFor(() => {
        expect(screen.getByText('Restore Failed')).toBeInTheDocument();
      });

      expect(mockGetErrorMessage).toHaveBeenCalled();
    });

    it('handles generic passkey errors', async () => {
      mockAuthenticateWithPRF.mockRejectedValue(
        new PasskeyError('Something went wrong', 'failed')
      );

      render(<PasskeyRestore onComplete={mockOnComplete} />);
      fireEvent.click(screen.getByText('Restore with Passkey'));

      await waitFor(() => {
        expect(screen.getByText('Restore Failed')).toBeInTheDocument();
      });

      expect(mockGetErrorMessage).toHaveBeenCalled();
    });

    it('handles unexpected errors', async () => {
      mockAuthenticateWithPRF.mockRejectedValue(new Error('Network error'));

      render(<PasskeyRestore onComplete={mockOnComplete} />);
      fireEvent.click(screen.getByText('Restore with Passkey'));

      await waitFor(() => {
        expect(screen.getByText('Restore Failed')).toBeInTheDocument();
      });

      expect(screen.getByText('Network error')).toBeInTheDocument();
    });

    it('shows retry button on error', async () => {
      mockAuthenticateWithPRF.mockRejectedValue(
        new PasskeyError('Authentication failed', 'failed')
      );

      render(<PasskeyRestore onComplete={mockOnComplete} />);
      fireEvent.click(screen.getByText('Restore with Passkey'));

      await waitFor(() => {
        expect(screen.getByText('Try Again')).toBeInTheDocument();
      });
    });

    it('returns to initial state when retry is clicked', async () => {
      mockAuthenticateWithPRF
        .mockRejectedValueOnce(new PasskeyError('Authentication failed', 'failed'))
        .mockResolvedValueOnce({
          prfOutput: mockPrfOutput,
          credentialId: mockCredentialId,
          userVerified: true,
        });

      render(<PasskeyRestore onComplete={mockOnComplete} />);
      fireEvent.click(screen.getByText('Restore with Passkey'));

      await waitFor(() => {
        expect(screen.getByText('Try Again')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Try Again'));

      await waitFor(() => {
        expect(screen.getByText('Restore with Passkey')).toBeInTheDocument();
      });
    });

    it('shows "Use Recovery Phrase Instead" button when onCancel provided', async () => {
      mockAuthenticateWithPRF.mockRejectedValue(
        new PasskeyError('Authentication failed', 'failed')
      );

      render(<PasskeyRestore onComplete={mockOnComplete} onCancel={mockOnCancel} />);
      fireEvent.click(screen.getByText('Restore with Passkey'));

      await waitFor(() => {
        expect(screen.getByText('Use Recovery Phrase Instead')).toBeInTheDocument();
      });
    });

    it('calls onCancel when "Use Recovery Phrase Instead" is clicked', async () => {
      mockAuthenticateWithPRF.mockRejectedValue(
        new PasskeyError('Authentication failed', 'failed')
      );

      render(<PasskeyRestore onComplete={mockOnComplete} onCancel={mockOnCancel} />);
      fireEvent.click(screen.getByText('Restore with Passkey'));

      await waitFor(() => {
        expect(screen.getByText('Use Recovery Phrase Instead')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Use Recovery Phrase Instead'));
      expect(mockOnCancel).toHaveBeenCalled();
    });

    it('shows cross-device recovery guidance on error', async () => {
      mockAuthenticateWithPRF.mockRejectedValue(
        new PasskeyError('No passkey found', 'no_credentials_found')
      );

      render(<PasskeyRestore onComplete={mockOnComplete} />);
      fireEvent.click(screen.getByText('Restore with Passkey'));

      await waitFor(() => {
        expect(screen.getByText('Need to restore on a different device?')).toBeInTheDocument();
      });

      expect(
        screen.getByText(/If you created your wallet on a different device, you'll need your 12-word recovery phrase/)
      ).toBeInTheDocument();
    });
  });

  describe('Props Interface', () => {
    it('accepts custom rpId', async () => {
      mockAuthenticateWithPRF.mockResolvedValue({
        prfOutput: mockPrfOutput,
        credentialId: mockCredentialId,
        userVerified: true,
      });

      render(<PasskeyRestore onComplete={mockOnComplete} rpId='custom.app' />);
      fireEvent.click(screen.getByText('Restore with Passkey'));

      await waitFor(() => {
        expect(mockAuthenticateWithPRF).toHaveBeenCalledWith(
          'custom.app',
          expect.any(String),
          expect.any(Object)
        );
      });
    });

    it('onComplete receives mnemonic string', async () => {
      mockAuthenticateWithPRF.mockResolvedValue({
        prfOutput: mockPrfOutput,
        credentialId: mockCredentialId,
        userVerified: true,
      });

      render(<PasskeyRestore onComplete={mockOnComplete} />);
      fireEvent.click(screen.getByText('Restore with Passkey'));

      await waitFor(() => {
        expect(mockOnComplete).toHaveBeenCalledTimes(1);
      });

      const receivedMnemonic = mockOnComplete.mock.calls[0][0];
      expect(typeof receivedMnemonic).toBe('string');
      expect(receivedMnemonic.split(' ').length).toBe(12);
    });

    it('onCancel is optional', () => {
      // Should not throw when onCancel is not provided
      expect(() => {
        render(<PasskeyRestore onComplete={mockOnComplete} />);
      }).not.toThrow();
    });
  });

  describe('Security Requirements', () => {
    it('requires passkey authentication before restore', async () => {
      mockAuthenticateWithPRF.mockResolvedValue({
        prfOutput: mockPrfOutput,
        credentialId: mockCredentialId,
        userVerified: true,
      });

      render(<PasskeyRestore onComplete={mockOnComplete} />);

      // Should not call onComplete before authentication
      expect(mockOnComplete).not.toHaveBeenCalled();

      fireEvent.click(screen.getByText('Restore with Passkey'));

      await waitFor(() => {
        expect(mockAuthenticateWithPRF).toHaveBeenCalled();
      });

      await waitFor(() => {
        expect(mockOnComplete).toHaveBeenCalled();
      });
    });

    it('requires user verification during authentication', async () => {
      mockAuthenticateWithPRF.mockResolvedValue({
        prfOutput: mockPrfOutput,
        credentialId: mockCredentialId,
        userVerified: true,
      });

      render(<PasskeyRestore onComplete={mockOnComplete} />);
      fireEvent.click(screen.getByText('Restore with Passkey'));

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

    it('uses stored credential ID for authentication', async () => {
      mockAuthenticateWithPRF.mockResolvedValue({
        prfOutput: mockPrfOutput,
        credentialId: mockCredentialId,
        userVerified: true,
      });

      render(<PasskeyRestore onComplete={mockOnComplete} />);
      fireEvent.click(screen.getByText('Restore with Passkey'));

      await waitFor(() => {
        expect(mockGetCredentialId).toHaveBeenCalled();
      });

      await waitFor(() => {
        expect(mockAuthenticateWithPRF).toHaveBeenCalledWith(
          expect.any(String),
          mockCredentialId,
          expect.objectContaining({
            credentialId: mockCredentialId,
          })
        );
      });
    });
  });

  describe('Cross-Device Handling', () => {
    it('shows specific error when no passkey wallet exists', async () => {
      mockGetCredentialId.mockReturnValue(null);
      mockHasPasskeyWallet.mockReturnValue(false);

      render(<PasskeyRestore onComplete={mockOnComplete} />);
      fireEvent.click(screen.getByText('Restore with Passkey'));

      await waitFor(() => {
        expect(screen.getByText('Restore Failed')).toBeInTheDocument();
      });

      expect(
        screen.getByText(/No passkey found on this device. If you created your wallet on a different device/)
      ).toBeInTheDocument();
    });

    it('does not allow restore without passkey authentication', async () => {
      mockAuthenticateWithPRF.mockRejectedValue(
        new PasskeyError('No passkey found', 'no_credentials_found')
      );

      render(<PasskeyRestore onComplete={mockOnComplete} />);
      fireEvent.click(screen.getByText('Restore with Passkey'));

      await waitFor(() => {
        expect(screen.getByText('Restore Failed')).toBeInTheDocument();
      });

      expect(mockOnComplete).not.toHaveBeenCalled();
    });
  });
});
