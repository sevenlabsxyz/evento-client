'use client';

import { Button } from '@/components/ui/button';
import { UserAvatar } from '@/components/ui/user-avatar';
import { WalletBalanceDisplay } from '@/components/wallet/wallet-balance-display';
import { getIntlLocale } from '@/lib/i18n/active-locale';
import { ArrowLeft, X, Zap } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import type { RecipientInfo } from '../zap-types';

interface ZapConfirmStepProps {
  recipient: RecipientInfo;
  selectedAmount: number;
  amountUSD: string;
  comment: string;
  feeSats?: number;
  onConfirm: () => void;
  onBack: () => void;
  onClose: () => void;
}

export function ZapConfirmStep({
  recipient,
  selectedAmount,
  amountUSD,
  comment,
  feeSats,
  onConfirm,
  onBack,
  onClose,
}: ZapConfirmStepProps) {
  const t = useTranslations('zap.steps');
  const tCommon = useTranslations('common');
  const locale = getIntlLocale(useLocale());
  return (
    <div className='flex flex-col'>
      {/* Header */}
      <div className='flex items-center justify-between p-4 pt-0'>
        <button
          onClick={onBack}
          aria-label={tCommon('actions.back')}
          className='rounded-full p-2 transition-colors hover:bg-gray-100 dark:hover:bg-neutral-800'
        >
          <ArrowLeft className='h-5 w-5' />
        </button>
        <h2 className='text-xl font-semibold'>{t('confirmZap')}</h2>
        <div className='flex items-center gap-3'>
          <WalletBalanceDisplay />
          <button
            onClick={onClose}
            aria-label={tCommon('actions.close')}
            className='rounded-full p-2 transition-colors hover:bg-gray-100 dark:hover:bg-neutral-800'
          >
            <X className='h-5 w-5' />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className='flex-1 overflow-y-auto p-6'>
        <div className='mx-auto max-w-md space-y-6'>
          {/* Amount Display */}
          <div className='rounded-xl border border-red-200 bg-red-50 p-8 text-center dark:border-red-900 dark:bg-red-950/40'>
            <Zap className='mx-auto h-12 w-12 text-red-500 dark:text-red-400' />
            <p className='mt-4 text-4xl font-bold text-gray-900 dark:text-neutral-100'>
              {t('sats', { amount: selectedAmount.toLocaleString(locale) })}
            </p>
            {amountUSD && (
              <p className='mt-1 text-lg text-gray-600 dark:text-neutral-400'>
                {t('usdApprox', { amount: amountUSD })}
              </p>
            )}
          </div>

          {/* Recipient */}
          <div className='rounded-xl border border-gray-200 bg-gray-50 p-4 dark:border-neutral-800 dark:bg-neutral-950'>
            <p className='mb-1 text-xs text-gray-500 dark:text-neutral-400'>{t('sendingTo')}</p>
            <div className='flex items-center gap-3'>
              <UserAvatar
                user={{
                  name: recipient.name,
                  username: recipient.username,
                  image: recipient.avatar,
                }}
                height={40}
                width={40}
                className='flex-shrink-0'
              />
              <div>
                <p className='font-semibold text-gray-900 dark:text-neutral-100'>
                  {recipient.name}
                </p>
                <p className='font-mono text-xs text-gray-500 dark:text-neutral-400'>
                  {recipient.lightningAddress}
                </p>
              </div>
            </div>
          </div>

          {/* Fee */}
          {feeSats !== undefined && (
            <div className='rounded-xl border border-gray-200 bg-gray-50 p-4 dark:border-neutral-800 dark:bg-neutral-950'>
              <div className='flex justify-between'>
                <span className='text-sm text-gray-500 dark:text-neutral-400'>
                  {t('networkFee')}
                </span>
                <span className='text-sm font-medium'>{t('sats', { amount: feeSats })}</span>
              </div>
            </div>
          )}

          {/* Comment (if provided) */}
          {comment && (
            <div className='rounded-xl border border-gray-200 bg-gray-50 p-4 dark:border-neutral-800 dark:bg-neutral-950'>
              <p className='mb-1 text-xs text-gray-500 dark:text-neutral-400'>{t('message')}</p>
              <p className='text-sm text-gray-700 dark:text-neutral-300'>{comment}</p>
            </div>
          )}

          {/* Confirm Button */}
          <Button
            onClick={onConfirm}
            className='h-12 w-full rounded-full bg-red-500 font-semibold text-white hover:bg-red-600 dark:bg-red-600 dark:hover:bg-red-700'
          >
            {t('confirmAndSend')}
          </Button>
        </div>
      </div>
    </div>
  );
}
