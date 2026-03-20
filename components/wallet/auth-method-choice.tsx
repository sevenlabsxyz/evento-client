'use client';

import { Button } from '@/components/ui/button';
import { Fingerprint, Key, Shield } from 'lucide-react';

interface AuthMethodChoiceProps {
  onSelectPasskey: () => void;
  onSelectPin: () => void;
  passkeyAvailable: boolean;
  passkeySupported: boolean;
}

export function AuthMethodChoice({
  onSelectPasskey,
  onSelectPin,
  passkeyAvailable,
  passkeySupported,
}: AuthMethodChoiceProps) {
  return (
    <div className="flex flex-col items-center space-y-6 px-4">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900">Choose Security Method</h2>
        <p className="mt-2 text-gray-600">
          How would you like to protect your wallet?
        </p>
      </div>

      {/* Passkey Option */}
      <button
        onClick={onSelectPasskey}
        disabled={!passkeySupported}
        className={`w-full max-w-sm rounded-2xl border-2 p-6 text-left transition-all ${
          passkeySupported
            ? 'border-orange-500 bg-orange-50 hover:bg-orange-100'
            : 'border-gray-200 bg-gray-50 opacity-60 cursor-not-allowed'
        }`}
      >
        <div className="flex items-start gap-4">
          <div className={`rounded-full p-3 ${
            passkeySupported ? 'bg-orange-200' : 'bg-gray-200'
          }`}>
            <Fingerprint className="h-8 w-8 text-orange-600" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-gray-900">Use Passkey</h3>
              {passkeySupported && (
                <span className="rounded-full bg-orange-500 px-2 py-0.5 text-xs font-medium text-white">
                  Recommended
                </span>
              )}
            </div>
            <p className="mt-1 text-sm text-gray-600">
              Face ID, fingerprint, or device PIN. No recovery phrase needed.
            </p>
            {passkeyAvailable && (
              <p className="mt-2 text-xs text-green-600">
                ✓ Passkey already set up on this device
              </p>
            )}
            {!passkeySupported && (
              <p className="mt-2 text-xs text-gray-500">
                Not available on this browser. Try Chrome, Safari, or Edge.
              </p>
            )}
          </div>
        </div>
      </button>

      {/* PIN Option */}
      <button
        onClick={onSelectPin}
        className="w-full max-w-sm rounded-2xl border border-gray-200 bg-white p-6 text-left transition-all hover:bg-gray-50"
      >
        <div className="flex items-start gap-4">
          <div className="rounded-full bg-gray-100 p-3">
            <Key className="h-8 w-8 text-gray-600" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-gray-900">Use PIN Code</h3>
            <p className="mt-1 text-sm text-gray-600">
              4-6 digit PIN with 12-word recovery phrase backup.
            </p>
          </div>
        </div>
      </button>

      {/* Security Note */}
      <div className="flex items-center gap-2 text-xs text-gray-500">
        <Shield className="h-4 w-4" />
        <span>Both methods are self-custodial - you control your keys</span>
      </div>
    </div>
  );
}
