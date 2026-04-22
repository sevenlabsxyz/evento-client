'use client';

import { Info } from '@/components/icons/lucide';
import { STORAGE_KEYS } from '@/lib/constants/storage-keys';
import { toast } from '@/lib/utils/toast';

interface WalletUnlockRedirectOptions {
  rememberBatchZapReturnPath?: boolean;
}

interface RouterLike {
  push: (href: string) => void;
}

export const hasExistingWallet = () => {
  if (typeof window === 'undefined') {
    return false;
  }

  const walletStateRaw = localStorage.getItem(STORAGE_KEYS.WALLET_STATE);
  const encryptedSeed = localStorage.getItem(STORAGE_KEYS.ENCRYPTED_SEED);

  if (encryptedSeed) {
    return true;
  }

  if (!walletStateRaw) {
    return false;
  }

  try {
    const parsedState = JSON.parse(walletStateRaw);
    return Boolean(parsedState?.isInitialized);
  } catch {
    return true;
  }
};

export const saveWalletUnlockReturnPath = ({
  rememberBatchZapReturnPath = false,
}: WalletUnlockRedirectOptions = {}) => {
  if (typeof window === 'undefined') {
    return;
  }

  const returnPath = `${window.location.pathname}${window.location.search}${window.location.hash}`;
  localStorage.setItem(STORAGE_KEYS.WALLET_UNLOCK_RETURN_PATH, returnPath);

  if (rememberBatchZapReturnPath) {
    localStorage.setItem(STORAGE_KEYS.BATCH_ZAP_RETURN_PATH, returnPath);
  }
};

export const redirectToWalletUnlock = (
  router: RouterLike,
  options: WalletUnlockRedirectOptions = {}
) => {
  saveWalletUnlockReturnPath(options);
  router.push('/e/wallet');
};

export const showWalletUnlockToast = (onAction: () => void) => {
  const walletExists = hasExistingWallet();
  const actionLabel = walletExists ? 'Unlock wallet' : 'Create wallet';
  const descriptionText = walletExists
    ? 'Please unlock your Wallet to continue.'
    : 'Please create your Wallet to continue.';

  toast.custom(
    (id) => (
      <div className='w-full border border-blue-200 bg-blue-50 p-6 shadow-lg rounded-[28px]'>
        <div className='flex items-start gap-3'>
          <div className='mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-blue-600 text-white'>
            <Info className='h-4 w-4' />
          </div>
          <div className='min-w-0'>
            <p className='text-base font-semibold leading-none tracking-tight text-slate-900'>
              Wallet action needed
            </p>
            <p className='mt-3 text-[16px] leading-[1.3] text-slate-700'>{descriptionText}</p>
          </div>
        </div>
        <button
          type='button'
          onClick={() => {
            toast.dismiss(id);
            onAction();
          }}
          className='mt-5 h-12 w-full rounded-full bg-blue-600 px-4 text-base font-semibold text-white transition-colors hover:bg-blue-700'
        >
          {actionLabel}
        </button>
      </div>
    ),
    {
      unstyled: true,
    }
  );
};
