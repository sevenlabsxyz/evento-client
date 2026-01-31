'use client';

import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';

interface AddToAppleWalletButtonProps {
  onClick: () => void;
  isLoading?: boolean;
  disabled?: boolean;
  className?: string;
}

/**
 * Official Apple Wallet button following Apple's design guidelines
 * @see https://developer.apple.com/wallet/add-to-apple-wallet-guidelines/
 */
export function AddToAppleWalletButton({
  onClick,
  isLoading = false,
  disabled = false,
  className,
}: AddToAppleWalletButtonProps) {
  return (
    <motion.button
      onClick={onClick}
      disabled={disabled || isLoading}
      whileTap={{ scale: 0.95 }}
      transition={{ type: 'spring', stiffness: 400, damping: 17 }}
      className={cn(
        'inline-flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-black px-4 text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50',
        className
      )}
      aria-label="Add to Apple Wallet"
    >
      {isLoading ? (
        <Loader2 className="h-5 w-5 animate-spin" />
      ) : (
        <AppleWalletIcon className="h-8 w-8" />
      )}
      <span className="text-sm font-medium">
        {isLoading ? 'Generating Pass...' : 'Add to Apple Wallet'}
      </span>
    </motion.button>
  );
}

/**
 * Apple Wallet icon SVG - simplified version of the official badge
 */
function AppleWalletIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      aria-hidden="true"
    >
      {/* Apple logo */}
      <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
    </svg>
  );
}
