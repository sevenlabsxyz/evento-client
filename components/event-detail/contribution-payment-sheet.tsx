'use client';

import { CashAppSVGIcon } from '@/components/icons/cashapp';
import { PayPalSVGIcon } from '@/components/icons/paypal';
import { VenmoSVGIcon } from '@/components/icons/venmo';
import { useMediaQuery } from '@/lib/hooks/use-media-query';
import { useUpsertRSVP } from '@/lib/hooks/use-upsert-rsvp';
import { useUserRSVP } from '@/lib/hooks/use-user-rsvp';
import { Event as ApiEvent } from '@/lib/types/api';
import { getContributionMethods } from '@/lib/utils/event-transform';
import { toast } from '@/lib/utils/toast';
import { VisuallyHidden } from '@silk-hq/components';
import {
  ArrowLeft,
  CalendarPlus,
  Check,
  ChevronRight,
  ExternalLink,
  Loader2,
  Share2,
  TriangleAlert,
} from 'lucide-react';
import { ReactNode, useEffect, useState } from 'react';
import { DetachedSheet } from '../ui/detached-sheet';

type PaymentStep =
  | 'PAYMENT_METHODS'
  | 'CUSTOM_AMOUNT'
  | 'RETURN_CONFIRMATION'
  | 'PAYMENT_CONFIRMATION'
  | 'SUCCESS';

interface ContributionPaymentSheetProps {
  isOpen: boolean;
  onClose: () => void;
  eventData: ApiEvent;
  onSuccess?: () => void;
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
    bgColor: 'bg-green-100',
    label: 'Cash App',
    getPaymentUrl: (username, amount, isMobile) => {
      const strippedUsername = username.replace(/^[@$]/, '');
      return isMobile
        ? `https://cash.app/${strippedUsername}/${amount}`
        : `https://cash.app/${strippedUsername}`;
    },
  },
  venmo: {
    icon: <VenmoSVGIcon className='h-8 w-8' />,
    bgColor: 'bg-blue-100',
    label: 'Venmo',
    getPaymentUrl: (username, amount, isMobile) => {
      const strippedUsername = username.replace(/^[@$]/, '');
      return isMobile
        ? `venmo://paycharge?txn=pay&recipients=${strippedUsername}&amount=${amount}&note=Evento`
        : `https://account.venmo.com/u/${strippedUsername}`;
    },
  },
  paypal: {
    icon: <PayPalSVGIcon className='h-8 w-8' />,
    bgColor: 'bg-blue-100',
    label: 'PayPal',
    getPaymentUrl: (username, amount) => {
      const strippedUsername = username.replace(/^[@$]/, '');
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
  onSuccess,
}: ContributionPaymentSheetProps) {
  const { isMobile } = useMediaQuery();
  const contributionMethods = getContributionMethods(eventData);
  const suggestedCost = eventData.cost ?? 0;

  const [step, setStep] = useState<PaymentStep>('PAYMENT_METHODS');
  const [selectedMethod, setSelectedMethod] = useState<string | null>(null);
  const [customAmount, setCustomAmount] = useState<number>(suggestedCost);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data: userRsvpData } = useUserRSVP(eventData.id);
  const upsertRsvp = useUpsertRSVP();
  const hasExistingRsvp = !!userRsvpData?.rsvp;

  useEffect(() => {
    if (!isOpen) {
      setStep('PAYMENT_METHODS');
      setSelectedMethod(null);
      setCustomAmount(suggestedCost);
      setIsSubmitting(false);
    }
  }, [isOpen, suggestedCost]);

  const handleMethodSelect = (methodType: string) => {
    setSelectedMethod(methodType);
    setStep('RETURN_CONFIRMATION');
  };

  const handleOpenPaymentApp = () => {
    if (!selectedMethod) return;

    const method = contributionMethods.find((m) => m.type === selectedMethod);
    if (!method) return;

    const config = PAYMENT_METHOD_CONFIG[selectedMethod];
    if (!config) return;

    const paymentUrl = config.getPaymentUrl(method.value, customAmount, isMobile);
    window.open(paymentUrl, '_blank', 'noopener,noreferrer');
    setStep('PAYMENT_CONFIRMATION');
  };

  const handleConfirmPayment = async () => {
    setIsSubmitting(true);
    try {
      await upsertRsvp.mutateAsync(
        { eventId: eventData.id, status: 'yes', hasExisting: hasExistingRsvp },
        {
          onSuccess: () => {
            setStep('SUCCESS');
          },
          onError: () => {
            toast.error('Failed to confirm RSVP. Please try again.');
          },
        }
      );
    } catch {
      toast.error('Failed to confirm RSVP. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleShare = async () => {
    const url = window.location.href;

    if (navigator.share) {
      try {
        await navigator.share({
          title: eventData.title,
          text: eventData.description || '',
          url,
        });
        return;
      } catch (error: any) {
        if (error?.name === 'AbortError') return;
      }
    }

    try {
      await navigator.clipboard.writeText(url);
      toast.success('Link copied to clipboard!');
    } catch {
      const textArea = document.createElement('textarea');
      textArea.value = url;
      textArea.style.position = 'fixed';
      textArea.style.left = '-999999px';
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      toast.success('Link copied to clipboard!');
    }
  };

  const handleAddToCalendar = () => {
    const formatICSDate = (dateStr: string) => {
      const date = new Date(dateStr);
      return date
        .toISOString()
        .replace(/[-:]/g, '')
        .replace(/\.\d{3}/, '');
    };

    const escapeICS = (text: string) => {
      return text
        .replace(/[\n\r]/g, '\\n')
        .replace(/,/g, '\\,')
        .replace(/;/g, '\\;');
    };

    const icsContent = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Evento//Event Calendar//EN',
      'BEGIN:VEVENT',
      `UID:${eventData.id}@evento.so`,
      `DTSTAMP:${formatICSDate(new Date().toISOString())}`,
      `DTSTART:${formatICSDate(eventData.computed_start_date)}`,
      `DTEND:${formatICSDate(eventData.computed_end_date)}`,
      `SUMMARY:${escapeICS(eventData.title)}`,
      `DESCRIPTION:${escapeICS((eventData.description || '').replace(/<[^>]*>/g, ''))}`,
      `LOCATION:${escapeICS(eventData.location || '')}`,
      'END:VEVENT',
      'END:VCALENDAR',
    ].join('\r\n');

    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${eventData.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.ics`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleFinish = () => {
    onSuccess?.();
    onClose();
  };

  const renderPaymentMethods = () => (
    <div className='p-6 pb-24'>
      <div className='mb-4 flex justify-center'>
        <DetachedSheet.Handle />
      </div>

      <VisuallyHidden.Root asChild>
        <DetachedSheet.Title>Contribution</DetachedSheet.Title>
      </VisuallyHidden.Root>

      <div className='mb-6 text-center'>
        <p className='mb-2 text-sm text-gray-500'>The host has requested a contribution</p>
        {suggestedCost > 0 ? (
          <>
            <p className='text-5xl font-bold text-gray-900'>{formatUSD(customAmount)}</p>
            <button
              onClick={() => setStep('CUSTOM_AMOUNT')}
              className='mt-2 text-sm text-red-500 underline'
            >
              Change amount
            </button>
          </>
        ) : (
          <p className='text-lg font-medium text-gray-700'>Any amount is appreciated</p>
        )}
      </div>

      <p className='mb-4 text-center text-sm text-gray-500'>Select a payment method:</p>

      <div className='space-y-3'>
        {contributionMethods.map((method) => {
          const config = PAYMENT_METHOD_CONFIG[method.type];
          if (!config) return null;

          return (
            <button
              key={method.type}
              onClick={() => handleMethodSelect(method.type)}
              className='flex w-full items-center justify-between rounded-2xl border border-gray-200 bg-gray-50 p-4 transition-colors hover:bg-gray-100'
            >
              <div className='flex items-center gap-4'>
                <div
                  className={`flex h-12 w-12 items-center justify-center rounded-xl ${config.bgColor}`}
                >
                  {config.icon}
                </div>
                <div className='text-left'>
                  <p className='font-medium text-gray-900'>{method.value}</p>
                  <p className='text-sm text-gray-500'>Pay with {config.label}</p>
                </div>
              </div>
              <ChevronRight className='h-5 w-5 text-gray-400' />
            </button>
          );
        })}
      </div>

      <button
        onClick={onClose}
        className='mt-6 w-full rounded-xl border border-gray-200 bg-white py-3 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-50'
      >
        Cancel
      </button>
    </div>
  );

  const renderCustomAmount = () => (
    <div className='p-6 pb-24'>
      <div className='mb-4 flex justify-center'>
        <DetachedSheet.Handle />
      </div>

      <VisuallyHidden.Root asChild>
        <DetachedSheet.Title>Custom Amount</DetachedSheet.Title>
      </VisuallyHidden.Root>

      <div className='mb-6 text-center'>
        <p className='mb-4 text-sm text-gray-500'>Enter your contribution amount</p>
        <div className='flex items-center justify-center gap-2'>
          <span className='text-4xl font-bold text-gray-400'>$</span>
          <input
            type='number'
            value={customAmount || ''}
            onChange={(e) => setCustomAmount(Number(e.target.value))}
            placeholder='0'
            min='0'
            step='1'
            className='w-32 border-b-2 border-gray-300 bg-transparent text-center text-5xl font-bold text-gray-900 focus:border-red-500 focus:outline-none'
          />
        </div>
        {suggestedCost > 0 && (
          <p className='mt-2 text-sm text-gray-400'>Suggested: {formatUSD(suggestedCost)}</p>
        )}
      </div>

      <div className='space-y-3'>
        <button
          onClick={() => setStep('PAYMENT_METHODS')}
          disabled={customAmount <= 0}
          className='w-full rounded-xl bg-red-500 py-4 text-base font-semibold text-white transition-colors hover:bg-red-600 disabled:cursor-not-allowed disabled:opacity-50'
        >
          Continue
        </button>
        <button
          onClick={() => {
            setCustomAmount(suggestedCost);
            setStep('PAYMENT_METHODS');
          }}
          className='w-full rounded-xl border border-gray-200 bg-white py-3 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-50'
        >
          Cancel
        </button>
      </div>
    </div>
  );

  const renderReturnConfirmation = () => {
    const config = selectedMethod ? PAYMENT_METHOD_CONFIG[selectedMethod] : null;

    return (
      <div className='p-6 pb-24'>
        <div className='mb-4 flex justify-center'>
          <DetachedSheet.Handle />
        </div>

        <VisuallyHidden.Root asChild>
          <DetachedSheet.Title>Confirmation</DetachedSheet.Title>
        </VisuallyHidden.Root>

        <div className='mb-6 flex flex-col items-center'>
          <div className='mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-yellow-100'>
            <TriangleAlert className='h-8 w-8 text-yellow-600' />
          </div>
          <p className='text-center text-lg text-gray-700'>
            Please <span className='font-semibold'>return to this page</span> after you have paid
            with {config?.label} <span className='font-semibold'>to finish your RSVP.</span>
          </p>
        </div>

        <div className='space-y-3'>
          <button
            onClick={handleOpenPaymentApp}
            className='flex w-full items-center justify-center gap-2 rounded-xl bg-red-500 py-4 text-base font-semibold text-white transition-colors hover:bg-red-600'
          >
            <ExternalLink className='h-5 w-5' />
            OK, open {config?.label}
          </button>
          <button
            onClick={() => setStep('PAYMENT_METHODS')}
            className='flex w-full items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white py-3 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-50'
          >
            <ArrowLeft className='h-4 w-4' />
            Back
          </button>
        </div>
      </div>
    );
  };

  const renderPaymentConfirmation = () => (
    <div className='p-6 pb-24'>
      <div className='mb-4 flex justify-center'>
        <DetachedSheet.Handle />
      </div>

      <VisuallyHidden.Root asChild>
        <DetachedSheet.Title>Confirm Payment</DetachedSheet.Title>
      </VisuallyHidden.Root>

      <div className='mb-6 text-center'>
        <p className='text-lg text-gray-600'>Please confirm that you've completed the payment</p>
      </div>

      <div className='space-y-3'>
        <button
          onClick={handleConfirmPayment}
          disabled={isSubmitting}
          className='w-full rounded-xl bg-red-500 py-4 text-base font-semibold text-white transition-colors hover:bg-red-600 disabled:cursor-not-allowed disabled:opacity-50'
        >
          {isSubmitting ? (
            <span className='flex items-center justify-center gap-2'>
              <Loader2 className='h-5 w-5 animate-spin' />
              Confirming...
            </span>
          ) : (
            "I've completed the payment!"
          )}
        </button>
        <button
          onClick={() => setStep('PAYMENT_METHODS')}
          disabled={isSubmitting}
          className='flex w-full items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white py-3 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-50'
        >
          <ArrowLeft className='h-4 w-4' />
          Back
        </button>
      </div>

      <p className='mt-4 text-center text-xs text-gray-400'>
        By confirming, you acknowledge that you've completed the payment. Your host will be
        notified.
      </p>
    </div>
  );

  const renderSuccess = () => (
    <div className='p-6 pb-24'>
      <div className='mb-4 flex justify-center'>
        <DetachedSheet.Handle />
      </div>

      <VisuallyHidden.Root asChild>
        <DetachedSheet.Title>Success</DetachedSheet.Title>
      </VisuallyHidden.Root>

      <div className='mb-6 flex flex-col items-center'>
        <div className='mb-4 flex h-16 w-16 items-center justify-center rounded-full border-2 border-green-500 bg-green-100'>
          <Check className='h-8 w-8 text-green-600' />
        </div>
        <h3 className='mb-2 text-xl font-semibold text-gray-900'>RSVP Confirmed!</h3>
        <p className='text-center text-gray-600'>
          Your RSVP and payment to <span className='font-semibold'>{eventData.title}</span> have
          been successfully recorded. We've let the host know you're coming!
        </p>
      </div>

      <div className='space-y-3'>
        <button
          onClick={handleFinish}
          className='w-full rounded-xl bg-red-500 py-4 text-base font-semibold text-white transition-colors hover:bg-red-600'
        >
          View Event Page
        </button>
        <div className='flex gap-3'>
          <button
            onClick={handleShare}
            className='flex flex-1 items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white py-3 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50'
          >
            <Share2 className='h-4 w-4' />
            Share
          </button>
          <button
            onClick={handleAddToCalendar}
            className='flex flex-1 items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white py-3 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50'
          >
            <CalendarPlus className='h-4 w-4' />
            Calendar
          </button>
        </div>
      </div>
    </div>
  );

  const renderStep = () => {
    switch (step) {
      case 'PAYMENT_METHODS':
        return renderPaymentMethods();
      case 'CUSTOM_AMOUNT':
        return renderCustomAmount();
      case 'RETURN_CONFIRMATION':
        return renderReturnConfirmation();
      case 'PAYMENT_CONFIRMATION':
        return renderPaymentConfirmation();
      case 'SUCCESS':
        return renderSuccess();
      default:
        return renderPaymentMethods();
    }
  };

  return (
    <DetachedSheet.Root
      presented={isOpen}
      onPresentedChange={(presented) => !presented && onClose()}
    >
      <DetachedSheet.Portal>
        <DetachedSheet.View>
          <DetachedSheet.Backdrop />
          <DetachedSheet.Content>{renderStep()}</DetachedSheet.Content>
        </DetachedSheet.View>
      </DetachedSheet.Portal>
    </DetachedSheet.Root>
  );
}
