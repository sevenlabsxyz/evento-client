'use client';

import { CashAppSVGIcon } from '@/components/icons/cashapp';
import { PayPalSVGIcon } from '@/components/icons/paypal';
import { VenmoSVGIcon } from '@/components/icons/venmo';
import { Event as ApiEvent } from '@/lib/types/api';
import { getContributionMethods } from '@/lib/utils/event-transform';
import { BadgeDollarSign, ChevronRight } from 'lucide-react';
import { ReactNode, useState } from 'react';
import ContributionPaymentSheet from './contribution-payment-sheet';

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
    bgColor: 'bg-green-100',
  },
  venmo: {
    icon: <VenmoSVGIcon className='h-6 w-6' />,
    bgColor: 'bg-blue-100',
  },
  paypal: {
    icon: <PayPalSVGIcon className='h-6 w-6' />,
    bgColor: 'bg-blue-100',
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
      <div className='border-b border-gray-100 pb-6'>
        <div className='mb-3 flex items-center gap-2'>
          <BadgeDollarSign className='h-5 w-5 text-green-600' />
          <span className='font-semibold text-gray-900'>Contribution</span>
        </div>

        <button
          onClick={() => setShowPaymentSheet(true)}
          className='flex w-full items-center justify-between rounded-2xl border border-gray-200 bg-gray-50 p-4 transition-colors hover:bg-gray-100'
        >
          <div className='flex items-center gap-3'>
            <div className='flex -space-x-2'>
              {contributionMethods.slice(0, 3).map((method) => {
                const config = PAYMENT_METHOD_CONFIG[method.type];
                if (!config) return null;
                return (
                  <div
                    key={method.type}
                    className={`flex h-8 w-8 items-center justify-center rounded-full border-2 border-white ${config.bgColor}`}
                  >
                    {config.icon}
                  </div>
                );
              })}
            </div>
            <div className='text-left'>
              <p className='font-medium text-gray-900'>
                {cost > 0 ? `Suggested: ${formatUSD(cost)}` : 'Contributions welcome'}
              </p>
              <p className='text-sm text-gray-500'>
                {contributionMethods.length} payment method
                {contributionMethods.length > 1 ? 's' : ''} available
              </p>
            </div>
          </div>
          <ChevronRight className='h-5 w-5 text-gray-400' />
        </button>
      </div>

      <ContributionPaymentSheet
        isOpen={showPaymentSheet}
        onClose={() => setShowPaymentSheet(false)}
        eventData={eventData}
      />
    </>
  );
}
