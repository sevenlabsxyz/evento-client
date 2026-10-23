'use client';

import { CashAppSVGIcon } from '@/components/icons/cashapp';
import { PayPalSVGIcon } from '@/components/icons/paypal';
import { VenmoSVGIcon } from '@/components/icons/venmo';
import { useMediaQuery } from '@/lib/hooks/use-media-query';
import { Event as ApiEvent } from '@/lib/types/api';
import { getContributionMethods } from '@/lib/utils/event-transform';
import { VisuallyHidden } from '@silk-hq/components';
import { ExternalLink } from 'lucide-react';
import { ReactNode, useEffect, useState } from 'react';
import { DetachedSheet } from '../ui/detached-sheet';

interface ContributionPaymentSheetProps {
  isOpen: boolean;
  onClose: () => void;
  eventData: ApiEvent;
}

interface PaymentMethodConfig {
  icon: ReactNode;
  bgColor: string;
  label: string;
  getPaymentUrl: (username: string, amount: number, isMobile: boolean) => string;
}

const PAYMENT_METHOD_CONFIG: Record<string, PaymentMethodConfig> = {
  cashapp: {
    icon: <CashAppSVGIcon className='h-8 w-8' />,
    bgColor: 'bg-green-100 dark:bg-green-950/60',
    label: 'Cash App',
    getPaymentUrl: (username, amount, isMobile) => {
      const strippedUsername = encodeURIComponent(username.replace(/^[@$]/, ''));
      return isMobile
        ? `https://cash.app/${strippedUsername}/${amount}`
        : `https://cash.app/${strippedUsername}`;
    },
  },
  venmo: {
    icon: <VenmoSVGIcon className='h-8 w-8' />,
    bgColor: 'bg-blue-100 dark:bg-blue-950/60',
    label: 'Venmo',
    getPaymentUrl: (username, amount, isMobile) => {
      const strippedUsername = encodeURIComponent(username.replace(/^[@$]/, ''));
      return isMobile
        ? `venmo://paycharge?txn=pay&recipients=${strippedUsername}&amount=${amount}&note=Evento`
        : `https://account.venmo.com/u/${strippedUsername}`;
    },
  },
  paypal: {
    icon: <PayPalSVGIcon className='h-8 w-8' />,
    bgColor: 'bg-blue-100 dark:bg-blue-950/60',
    label: 'PayPal',
    getPaymentUrl: (username, amount) => {
      const strippedUsername = encodeURIComponent(username.replace(/^[@$]/, ''));
      return `https://www.paypal.com/paypalme/${strippedUsername}/${amount}`;
    },
  },
};

function formatUSD(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
}

export default function ContributionPaymentSheet({
  isOpen,
  onClose,
  eventData,
}: ContributionPaymentSheetProps) {
  const { isMobile } = useMediaQuery();
  const contributionMethods = getContributionMethods(eventData);
  const suggestedCost = eventData.cost ?? 0;

  const [customAmount, setCustomAmount] = useState<number>(suggestedCost);
  const [isEditingAmount, setIsEditingAmount] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setCustomAmount(suggestedCost);
      setIsEditingAmount(false);
    }
  }, [isOpen, suggestedCost]);

  const getPaymentUrl = (methodType: string, methodValue: string) => {
    const config = PAYMENT_METHOD_CONFIG[methodType];
    if (!config) return '#';
    // Only template a positive, finite amount into the URL
    const amount = Number.isFinite(customAmount) && customAmount > 0 ? customAmount : 0;
    return config.getPaymentUrl(methodValue, amount, isMobile);
  };

  return (
    <DetachedSheet.Root
      presented={isOpen}
      onPresentedChange={(presented) => !presented && onClose()}
    >
      <DetachedSheet.Portal>
        <DetachedSheet.View>
          <DetachedSheet.Backdrop />
          <DetachedSheet.Content>
            <div className='p-6 pb-24'>
              <div className='mb-4 flex justify-center'>
                <DetachedSheet.Handle />
              </div>

              <VisuallyHidden.Root asChild>
                <DetachedSheet.Title>Contribution</DetachedSheet.Title>
              </VisuallyHidden.Root>

              <div className='mb-6 text-center'>
                <p className='mb-2 text-sm text-gray-500 dark:text-neutral-400'>
                  Support the host with a contribution
                </p>
                {suggestedCost > 0 ? (
                  <>
                    {isEditingAmount ? (
                      <div className='flex items-center justify-center gap-2'>
                        <span className='text-4xl font-bold text-gray-400 dark:text-neutral-500'>
                          $
                        </span>
                        <input
                          type='number'
                          value={customAmount || ''}
                          onChange={(e) => setCustomAmount(Number(e.target.value))}
                          onBlur={() => {
                            if (customAmount <= 0) setCustomAmount(suggestedCost);
                            setIsEditingAmount(false);
                          }}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              if (customAmount <= 0) setCustomAmount(suggestedCost);
                              setIsEditingAmount(false);
                            }
                          }}
                          placeholder='0'
                          min='0'
                          step='1'
                          autoFocus
                          className='w-32 border-b-2 border-gray-300 bg-transparent text-center text-5xl font-bold text-gray-900 focus:border-red-500 focus:outline-none dark:border-neutral-700 dark:text-neutral-100'
                        />
                      </div>
                    ) : (
                      <p className='text-5xl font-bold text-gray-900 dark:text-neutral-100'>
                        {formatUSD(customAmount)}
                      </p>
                    )}
                    <button
                      onClick={() => setIsEditingAmount(true)}
                      className='mt-2 text-sm text-red-500 underline dark:text-red-400'
                    >
                      Change amount
                    </button>
                  </>
                ) : (
                  <p className='text-lg font-medium text-gray-700 dark:text-neutral-300'>
                    Any amount is appreciated
                  </p>
                )}
              </div>

              <p className='mb-4 text-center text-sm text-gray-500 dark:text-neutral-400'>
                Choose how you&apos;d like to contribute:
              </p>

              <div className='space-y-3'>
                {contributionMethods.map((method) => {
                  const config = PAYMENT_METHOD_CONFIG[method.type];
                  if (!config) return null;

                  const paymentUrl = getPaymentUrl(method.type, method.value);

                  return (
                    <a
                      key={method.type}
                      href={paymentUrl}
                      target='_blank'
                      rel='noopener noreferrer'
                      className='flex w-full items-center justify-between rounded-2xl border border-gray-200 bg-gray-50 p-4 transition-colors hover:bg-gray-100 dark:border-neutral-800 dark:bg-neutral-950 dark:hover:bg-neutral-800'
                    >
                      <div className='flex items-center gap-4'>
                        <div
                          className={`flex h-12 w-12 items-center justify-center rounded-xl ${config.bgColor}`}
                        >
                          {config.icon}
                        </div>
                        <div className='text-left'>
                          <p className='font-medium text-gray-900 dark:text-neutral-100'>
                            {config.label}
                          </p>
                          <p className='text-sm text-gray-500 dark:text-neutral-400'>
                            {method.value}
                          </p>
                        </div>
                      </div>
                      <ExternalLink className='h-5 w-5 text-gray-400 dark:text-neutral-500' />
                    </a>
                  );
                })}
              </div>

              <button
                onClick={onClose}
                className='mt-6 w-full rounded-xl border border-gray-200 bg-white py-3 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-50 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-400 dark:hover:bg-neutral-950'
              >
                Close
              </button>
            </div>
          </DetachedSheet.Content>
        </DetachedSheet.View>
      </DetachedSheet.Portal>
    </DetachedSheet.Root>
  );
}
