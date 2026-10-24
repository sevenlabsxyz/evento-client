'use client';

import { CashAppSVGIcon } from '@/components/icons/cashapp';
import { PayPalSVGIcon } from '@/components/icons/paypal';
import { VenmoSVGIcon } from '@/components/icons/venmo';
import { Event as ApiEvent } from '@/lib/types/api';
import { getContributionMethods } from '@/lib/utils/event-transform';
import { ChevronRight } from 'lucide-react';
import { ReactNode, useState } from 'react';
import ContributionPaymentSheet from './contribution-payment-sheet';
import { EventSection } from './event-section';

interface EventContributionsProps {
  eventData: ApiEvent;
  eventId: string;
}

interface PaymentMethodConfig {
  icon: ReactNode;
  bgColor: string;
}

const PAYMENT_METHOD_CONFIG: Record<string, PaymentMethodConfig> = {
  cashapp: {
    icon: <CashAppSVGIcon className='h-6 w-6' />,
    bgColor: 'bg-green-100 dark:bg-green-950/60',
  },
  venmo: {
    icon: <VenmoSVGIcon className='h-6 w-6' />,
    bgColor: 'bg-blue-100 dark:bg-blue-950/60',
  },
  paypal: {
    icon: <PayPalSVGIcon className='h-6 w-6' />,
    bgColor: 'bg-blue-100 dark:bg-blue-950/60',
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

export default function EventContributions({ eventData, eventId }: EventContributionsProps) {
  const [showPaymentSheet, setShowPaymentSheet] = useState(false);
  const contributionMethods = getContributionMethods(eventData);
  const hasContributions = contributionMethods.length > 0;
  const cost = eventData.cost ?? 0;

  if (!hasContributions) {
    return null;
  }

  return (
    <>
      <EventSection title='Contributions' variant='plain'>
        <button
          type='button'
          onClick={() => setShowPaymentSheet(true)}
          className='flex w-full items-center justify-between gap-3 rounded-2xl border border-gray-200 bg-white p-4 transition-colors hover:bg-gray-50 dark:border-neutral-800 dark:bg-neutral-900 dark:hover:bg-neutral-800'
        >
          <div className='flex min-w-0 items-center gap-3'>
            <div className='flex -space-x-2'>
              {contributionMethods.slice(0, 3).map((method) => {
                const config = PAYMENT_METHOD_CONFIG[method.type];
                if (!config) return null;
                return (
                  <div
                    key={method.type}
                    className={`flex h-8 w-8 items-center justify-center rounded-full border-2 border-white dark:border-neutral-900 ${config.bgColor}`}
                  >
                    {config.icon}
                  </div>
                );
              })}
            </div>
            <div className='min-w-0 text-left'>
              <p className='truncate text-sm font-semibold text-gray-900 dark:text-neutral-100'>
                {cost > 0 ? `Suggested: ${formatUSD(cost)}` : 'Contributions welcome'}
              </p>
              <p className='text-sm text-gray-500 dark:text-neutral-500'>
                {contributionMethods.length} payment method
                {contributionMethods.length > 1 ? 's' : ''} available
              </p>
            </div>
          </div>
          <ChevronRight className='h-5 w-5 shrink-0 text-gray-400 dark:text-neutral-500' />
        </button>
      </EventSection>

      <ContributionPaymentSheet
        isOpen={showPaymentSheet}
        onClose={() => setShowPaymentSheet(false)}
        eventData={eventData}
      />
    </>
  );
}
