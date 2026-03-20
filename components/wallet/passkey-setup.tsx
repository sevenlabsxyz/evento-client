'use client';

import { Button } from '@/components/ui/button';
import { ArrowLeft, Fingerprint, Eye, EyeOff, Copy, Check } from 'lucide-react';
import { useState } from 'react';

interface PasskeySetupProps {
  onBack: () => void;
  onContinue: (mnemonic: string) => void;
  isCreating: boolean;
  error: string | null;
}

export function PasskeySetup({
  onBack,
  onContinue,
  isCreating,
  error,
}: PasskeySetupProps) {
  const [step, setStep] = useState<'intro' | 'creating' | 'backup' | 'done'>('intro');
  const [mnemonic, setMnemonic] = useState('');
  const [showPhrase, setShowPhrase] = useState(false);
  const [copied, setCopied] = useState(false);
  const [confirmed, setConfirmed] = useState(false);

  const handleStartSetup = async () => {
    setStep('creating');
    try {
      // This triggers the actual passkey creation
      // The mnemonic is returned for backup
      // onContinue should call createPasskeyWallet and return the mnemonic
      const result = await new Promise<{ mnemonic: string }>((resolve, reject) => {
        // The parent component will handle the actual creation
        // and call onContinue with the mnemonic
        onContinue(''); // This is a hack - we need the parent to handle this
        // Actually, let's use a different approach - pass a callback
      });
    } catch (err) {
      setStep('intro');
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(mnemonic);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (step === 'intro') {
    return (
      <div className="flex flex-col items-center space-y-6 px-4">
        <button
          onClick={onBack}
          className="absolute left-4 top-4 rounded-full p-2 hover:bg-gray-100"
        >
          <ArrowLeft className="h-6 w-6" />
        </button>

        <div className="text-center">
          <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-orange-100">
            <Fingerprint className="h-10 w-10 text-orange-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900">Set Up Passkey</h2>
          <p className="mt-2 text-gray-600">
            Use your device's biometric security to protect your wallet.
          </p>
        </div>

        <div className="w-full max-w-sm space-y-3">
          <div className="rounded-xl bg-blue-50 p-4">
            <h4 className="font-medium text-blue-900">What this means:</h4>
            <ul className="mt-2 space-y-2 text-sm text-blue-800">
              <li className="flex items-start gap-2">
                <span className="text-blue-600">✓</span>
                <span>No recovery phrase to write down right now</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-600">✓</span>
                <span>Works across devices with the same passkey</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-600">✓</span>
                <span>Your keys never leave this device</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-600">✓</span>
                <span>Emergency recovery phrase available in settings</span>
              </li>
            </ul>
          </div>

          <div className="rounded-xl bg-yellow-50 p-4">
            <p className="text-sm text-yellow-800">
              <strong>Note:</strong> Passkeys sync through your device platform
              (iCloud Keychain, Google Password Manager, Windows Hello). Make
              sure passkey syncing is enabled on your devices.
            </p>
          </div>
        </div>

        {error && (
          <div className="w-full max-w-sm rounded-lg bg-red-50 p-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="flex w-full max-w-sm flex-col gap-3">
          <Button
            onClick={handleStartSetup}
            disabled={isCreating}
            className="w-full bg-orange-500 hover:bg-orange-600"
          >
            {isCreating ? 'Setting up...' : 'Continue with Passkey'}
          </Button>
          <Button onClick={onBack} variant="ghost" className="w-full">
            Choose Different Method
          </Button>
        </div>
      </div>
    );
  }

  if (step === 'creating' || isCreating) {
    return (
      <div className="flex flex-col items-center justify-center space-y-4 px-4">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-orange-200 border-t-orange-500" />
        <p className="text-gray-600">Creating your passkey wallet...</p>
        <p className="text-sm text-gray-500">Follow the biometric prompt on your device</p>
      </div>
    );
  }

  if (step === 'backup' && mnemonic) {
    return (
      <div className="flex flex-col items-center space-y-6 px-4">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900">Emergency Recovery Phrase</h2>
          <p className="mt-2 text-gray-600">
            This is your emergency backup. You can also find this in settings later.
          </p>
        </div>

        <div className="w-full max-w-sm rounded-xl bg-gray-900 p-6">
          <div className="mb-4 flex items-center justify-between">
            <span className="text-sm text-gray-400">12-word phrase</span>
            <button
              onClick={() => setShowPhrase(!showPhrase)}
              className="text-gray-400 hover:text-white"
            >
              {showPhrase ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
            </button>
          </div>

          <div className="grid grid-cols-3 gap-2">
            {mnemonic.split(' ').map((word, i) => (
              <div
                key={i}
                className="flex items-center gap-2 rounded-lg bg-gray-800 p-2"
              >
                <span className="text-xs text-gray-500">{i + 1}</span>
                <span className={`font-mono text-sm ${showPhrase ? 'text-white' : 'text-gray-600'}`}>
                  {showPhrase ? word : '••••'}
                </span>
              </div>
            ))}
          </div>

          <button
            onClick={handleCopy}
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg bg-gray-800 py-2 text-sm text-gray-300 hover:bg-gray-700"
          >
            {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            {copied ? 'Copied!' : 'Copy to clipboard'}
          </button>
        </div>

        <div className="w-full max-w-sm space-y-3">
          <label className="flex items-start gap-3 rounded-lg border p-4 cursor-pointer">
            <input
              type="checkbox"
              checked={confirmed}
              onChange={(e) => setConfirmed(e.target.checked)}
              className="mt-1 h-4 w-4"
            />
            <span className="text-sm text-gray-700">
              I understand this is my emergency backup and I've saved it securely
            </span>
          </label>

          <Button
            disabled={!confirmed}
            className="w-full bg-orange-500 hover:bg-orange-600"
          >
            Complete Setup
          </Button>
        </div>
      </div>
    );
  }

  return null;
}
