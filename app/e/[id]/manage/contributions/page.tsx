'use client';

import { CashAppSVGIcon } from '@/components/icons/cashapp';
import { PayPalSVGIcon } from '@/components/icons/paypal';
import { VenmoSVGIcon } from '@/components/icons/venmo';
import { Skeleton } from '@/components/ui/skeleton';
import apiClient from '@/lib/api/client';
import { useEventDetails } from '@/lib/hooks/use-event-details';
import { useTopBar } from '@/lib/stores/topbar-store';
import { logger } from '@/lib/utils/logger';
import { toast } from '@/lib/utils/toast';
import { useQueryClient } from '@tanstack/react-query';
import { Check, DollarSign } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useParams, usePathname, useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';

interface PaymentMethod {
  enabled: boolean;
  value: string;
}

interface EventContributions {
  enabled: boolean;
  suggestedAmount?: {
    amount: number;
    currency: string;
  };
  paymentMethods: {
    cashApp?: PaymentMethod;
    venmo?: PaymentMethod;
    paypal?: PaymentMethod;
  };
}

export default function ContributionsManagementPage() {
  const { setTopBarForRoute, clearRoute, applyRouteConfig } = useTopBar();
  const t = useTranslations('manageLegacy');
  const params = useParams();
  const pathname = usePathname();
  const router = useRouter();
  const eventId = params.id as string;

  // Get existing event data from API
  const { data: existingEvent, isLoading, error } = useEventDetails(eventId);
  const queryClient = useQueryClient();

  // State for contributions - MUST be before any conditional returns
  const [contributions, setContributions] = useState<EventContributions>({
    enabled: false,
    suggestedAmount: {
      amount: 0,
      currency: 'USD',
    },
    paymentMethods: {
      cashApp: { enabled: false, value: '' },
      venmo: { enabled: false, value: '' },
      paypal: { enabled: false, value: '' },
    },
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  // handleSave must be defined before useEffects that reference it
  const handleSave = useCallback(async () => {
    if (!existingEvent) return;

    try {
      setIsSubmitting(true);

      const updateData = {
        contrib_cashapp: contributions.paymentMethods.cashApp?.enabled
          ? contributions.paymentMethods.cashApp.value
          : '',
        contrib_venmo: contributions.paymentMethods.venmo?.enabled
          ? contributions.paymentMethods.venmo.value
          : '',
        contrib_paypal: contributions.paymentMethods.paypal?.enabled
          ? contributions.paymentMethods.paypal.value
          : '',
        cost: contributions.suggestedAmount?.amount
          ? contributions.suggestedAmount.amount.toString()
          : '',
      };

      await apiClient.patch(`/v1/events/${eventId}`, updateData);

      queryClient.invalidateQueries({ queryKey: ['event', eventId] });

      toast.success(t('contributions.toasts.updated'));
      router.push(`/e/${eventId}/manage`);
    } catch (error) {
      logger.error('Failed to save contribution settings', {
        error: error instanceof Error ? error.message : String(error),
      });
      toast.error(t('contributions.toasts.updateFailed'));
    } finally {
      setIsSubmitting(false);
    }
  }, [existingEvent, contributions, eventId, queryClient, router, t]);

  // Initialize with existing event data
  useEffect(() => {
    if (existingEvent) {
      setContributions({
        enabled: !!(
          existingEvent.contrib_cashapp ||
          existingEvent.contrib_venmo ||
          existingEvent.contrib_paypal
        ),
        suggestedAmount: {
          amount: existingEvent.cost ?? 0,
          currency: 'USD',
        },
        paymentMethods: {
          cashApp: {
            enabled: !!existingEvent.contrib_cashapp,
            value: existingEvent.contrib_cashapp || '',
          },
          venmo: {
            enabled: !!existingEvent.contrib_venmo,
            value: existingEvent.contrib_venmo || '',
          },
          paypal: {
            enabled: !!existingEvent.contrib_paypal,
            value: existingEvent.contrib_paypal || '',
          },
        },
      });
    }
  }, [existingEvent]);

  // Configure TopBar
  useEffect(() => {
    applyRouteConfig(pathname);
    setTopBarForRoute(pathname, {
      title: t('contributions.title'),
      leftMode: 'back',
      centerMode: 'title',
      onBackPress: () => router.push(`/e/${eventId}/manage`),
      showAvatar: false,
      buttons: [
        {
          id: 'save-contributions',
          icon: Check,
          onClick: () => void handleSave(),
          label: t('contributions.save'),
          disabled: isSubmitting,
        },
      ],
    });

    return () => {
      clearRoute(pathname);
    };
  }, [
    setTopBarForRoute,
    clearRoute,
    isSubmitting,
    applyRouteConfig,
    pathname,
    handleSave,
    router,
    eventId,
    t,
  ]);

  // Conditional returns MUST come after all hooks
  if (isLoading) {
    return (
      <div className='space-y-4 py-4 md:py-6'>
        <div className='max-w-2xl space-y-4'>
          <Skeleton className='h-4 w-3/4' />

          {/* Contribution Settings Skeleton */}
          <div className='rounded-2xl border border-gray-200 bg-white p-6 dark:border-neutral-800 dark:bg-neutral-900'>
            <div className='mb-4 flex items-center gap-3'>
              <Skeleton className='h-12 w-12 rounded-xl' />
              <div className='space-y-2'>
                <Skeleton className='h-5 w-24' />
                <Skeleton className='h-4 w-40' />
              </div>
            </div>
            <div className='space-y-4'>
              <div className='space-y-2'>
                <Skeleton className='h-4 w-20' />
                <Skeleton className='h-12 w-full rounded-xl' />
              </div>
              <div className='space-y-2'>
                <Skeleton className='h-4 w-28' />
                <Skeleton className='h-24 w-full rounded-xl' />
              </div>
              <Skeleton className='h-12 w-full rounded-xl' />
            </div>
          </div>

          {/* Information Section Skeleton */}
          <div className='rounded-2xl bg-blue-50 p-4 dark:bg-blue-950/40'>
            <Skeleton className='mb-2 h-5 w-32' />
            <Skeleton className='h-4 w-full' />
            <Skeleton className='mt-1 h-4 w-3/4' />
          </div>
        </div>
      </div>
    );
  }

  if (error || !existingEvent) {
    return (
      <div className='flex items-center justify-center py-16'>
        <div className='text-center'>
          <h1 className='mb-2 text-2xl font-bold text-gray-900 dark:text-neutral-100'>
            {t('contributions.notFound.title')}
          </h1>
          <p className='mb-4 text-gray-600 dark:text-neutral-400'>
            {t('contributions.notFound.description')}
          </p>
          <button
            onClick={() => router.back()}
            className='rounded-lg bg-red-500 px-4 py-2 text-white hover:bg-red-600 dark:bg-red-600 dark:hover:bg-red-700'
          >
            {t('contributions.notFound.goBack')}
          </button>
        </div>
      </div>
    );
  }

  const currencies = [{ value: 'USD', label: '$', name: 'US Dollar' }];

  const handleAmountChange = (amount: number) => {
    setContributions((prev) => ({
      ...prev,
      suggestedAmount: {
        ...prev.suggestedAmount!,
        amount,
      },
    }));
  };

  const handlePaymentMethodToggle = (method: keyof EventContributions['paymentMethods']) => {
    setContributions((prev) => ({
      ...prev,
      paymentMethods: {
        ...prev.paymentMethods,
        [method]: {
          ...prev.paymentMethods[method]!,
          enabled: !prev.paymentMethods[method]!.enabled,
        },
      },
    }));
  };

  const handlePaymentMethodValue = (
    method: keyof EventContributions['paymentMethods'],
    value: string
  ) => {
    // Auto-format values
    let formattedValue = value;
    if (method === 'cashApp' && value && !value.startsWith('$')) {
      formattedValue = '$' + value.replace(/^\$/, '');
    } else if (method === 'venmo' && value && !value.startsWith('@')) {
      formattedValue = '@' + value.replace(/^@/, '');
    }

    setContributions((prev) => ({
      ...prev,
      paymentMethods: {
        ...prev.paymentMethods,
        [method]: {
          ...prev.paymentMethods[method]!,
          value: formattedValue,
        },
      },
    }));
  };

  const paymentMethods = [
    {
      key: 'cashApp' as const,
      name: 'Cash App',
      icon: <CashAppSVGIcon className='h-6 w-6' />,
      iconBg: 'bg-green-100 dark:bg-green-950/60',
      iconColor: '',
      placeholder: '$username',
      hint: t('contributions.methods.cashAppHint'),
    },
    {
      key: 'venmo' as const,
      name: 'Venmo',
      icon: <VenmoSVGIcon className='h-6 w-6' />,
      iconBg: 'bg-blue-100 dark:bg-blue-950/60',
      iconColor: '',
      placeholder: '@username',
      hint: t('contributions.methods.venmoHint'),
    },
    {
      key: 'paypal' as const,
      name: 'PayPal',
      icon: <PayPalSVGIcon className='h-6 w-6' />,
      iconBg: 'bg-blue-100 dark:bg-blue-950/60',
      iconColor: '',
      placeholder: t('contributions.methods.paypalPlaceholder'),
      hint: t('contributions.methods.paypalHint'),
    },
  ];

  const selectedCurrency = currencies.find(
    (c) => c.value === contributions.suggestedAmount?.currency
  );

  return (
    <div className='space-y-4 py-4 md:py-6'>
      <div className='max-w-2xl space-y-4'>
        <div>
          <h2 className='text-lg font-semibold text-gray-900 dark:text-neutral-100'>
            {t('contributions.title')}
          </h2>
          <p className='text-sm text-gray-500 dark:text-neutral-400'>
            {t('contributions.subtitle')}
          </p>
        </div>

        {/* Suggested Amount Section */}
        <div className='rounded-2xl border border-gray-200 bg-white p-6 dark:border-neutral-800 dark:bg-neutral-900'>
          <div className='mb-4 flex items-center gap-3'>
            <div className='flex h-10 w-10 items-center justify-center rounded-xl bg-green-100 dark:bg-green-950/60'>
              <DollarSign className='h-5 w-5 text-green-600 dark:text-green-400' />
            </div>
            <div>
              <h3 className='font-semibold text-gray-900 dark:text-neutral-100'>
                {t('contributions.suggested.title')}
              </h3>
              <p className='text-sm text-gray-600 dark:text-neutral-400'>
                {t('contributions.suggested.description')}
              </p>
            </div>
          </div>

          <div className='space-y-4'>
            <div className='flex items-center gap-3'>
              <div className='rounded-lg bg-gray-100 px-3 py-2 font-medium text-gray-700 dark:bg-neutral-800 dark:text-neutral-300'>
                $ USD
              </div>
              <input
                type='number'
                value={contributions.suggestedAmount?.amount || ''}
                onChange={(e) => handleAmountChange(Number(e.target.value))}
                placeholder='0.00'
                min='0'
                step='0.01'
                className='w-24 rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100 dark:placeholder-neutral-500 dark:caret-neutral-100'
              />
            </div>
            <p className='text-xs text-gray-500 dark:text-neutral-400'>
              {t('contributions.suggested.hint')}
            </p>
          </div>
        </div>

        {/* Payment Methods Section */}
        <div className='rounded-2xl border border-gray-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900'>
          <h3 className='text-sm font-semibold text-gray-900 dark:text-neutral-100'>
            {t('contributions.methods.title')}
          </h3>
          <p className='mb-3 text-sm text-gray-500 dark:text-neutral-400'>
            {t('contributions.methods.description')}
          </p>

          <div className='divide-y divide-gray-100 dark:divide-neutral-800'>
            {paymentMethods.map((method) => {
              const paymentData = contributions.paymentMethods[method.key];
              return (
                <div key={method.key} className='py-3 first:pt-0 last:pb-0'>
                  <div className='mb-3 flex items-center gap-3'>
                    <div
                      className={`h-10 w-10 ${method.iconBg} flex items-center justify-center rounded-xl`}
                    >
                      {method.icon}
                    </div>
                    <div className='flex-1'>
                      <h4 className='font-medium text-gray-900 dark:text-neutral-100'>
                        {method.name}
                      </h4>
                      <p className='text-xs text-gray-500 dark:text-neutral-400'>{method.hint}</p>
                    </div>
                    <button
                      onClick={() => handlePaymentMethodToggle(method.key)}
                      className={`h-6 w-10 rounded-full transition-colors ${
                        paymentData?.enabled ? 'bg-green-500' : 'bg-gray-300 dark:bg-neutral-600'
                      }`}
                    >
                      <div
                        className={`h-4 w-4 rounded-full bg-white transition-transform dark:bg-neutral-100 ${
                          paymentData?.enabled ? 'translate-x-5' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>

                  {paymentData?.enabled && (
                    <input
                      type='text'
                      value={paymentData.value}
                      onChange={(e) => handlePaymentMethodValue(method.key, e.target.value)}
                      placeholder={method.placeholder}
                      className='w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100 dark:placeholder-neutral-500 dark:caret-neutral-100'
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Information Section */}
        <div className='rounded-2xl bg-blue-50 p-4 dark:bg-blue-950/40'>
          <h4 className='mb-2 font-medium text-blue-900 dark:text-blue-400'>
            {t('contributions.info.title')}
          </h4>
          <p className='text-sm text-blue-700 dark:text-blue-400'>
            {t('contributions.info.description')}
          </p>
        </div>

        {/* Save Button */}
        <button
          onClick={() => void handleSave()}
          disabled={isSubmitting}
          className='w-full rounded-xl bg-red-500 py-4 text-base font-semibold text-white transition-colors hover:bg-red-600 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-red-600 dark:hover:bg-red-700'
        >
          {isSubmitting ? t('contributions.saving') : t('contributions.saveChanges')}
        </button>
      </div>
    </div>
  );
}
