'use client';

import { CashAppSVGIcon } from '@/components/icons/cashapp';
import { PayPalSVGIcon } from '@/components/icons/paypal';
import { VenmoSVGIcon } from '@/components/icons/venmo';
import { Skeleton } from '@/components/ui/skeleton';
import apiClient from '@/lib/api/client';
import { useEventDetails } from '@/lib/hooks/use-event-details';
import { useTopBar } from '@/lib/stores/topbar-store';
import { toast } from '@/lib/utils/toast';
import { useQueryClient } from '@tanstack/react-query';
import { Check, DollarSign } from 'lucide-react';
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

      toast.success('Contribution settings updated successfully!');
      router.push(`/e/${eventId}/manage`);
    } catch (error) {
      console.error('Failed to save contribution settings:', error);
      toast.error('Failed to update contribution settings');
    } finally {
      setIsSubmitting(false);
    }
  }, [existingEvent, contributions, eventId, queryClient, router]);

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
      title: 'Contributions',
      leftMode: 'back',
      centerMode: 'title',
      showAvatar: false,
      buttons: [
        {
          id: 'save-contributions',
          icon: Check,
          onClick: () => void handleSave(),
          label: 'Save',
          disabled: isSubmitting,
        },
      ],
    });

    return () => {
      clearRoute(pathname);
    };
  }, [setTopBarForRoute, clearRoute, isSubmitting, applyRouteConfig, pathname, handleSave]);

  // Conditional returns MUST come after all hooks
  if (isLoading) {
    return (
      <div className='mx-auto min-h-screen max-w-full bg-white md:max-w-sm'>
        <div className='space-y-6 p-4'>
          <Skeleton className='h-4 w-3/4' />

          {/* Contribution Settings Skeleton */}
          <div className='rounded-2xl bg-gray-50 p-6'>
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
          <div className='rounded-2xl bg-blue-50 p-4'>
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
      <div className='flex min-h-screen items-center justify-center bg-gray-50'>
        <div className='text-center'>
          <h1 className='mb-2 text-2xl font-bold text-gray-900'>Event Not Found</h1>
          <p className='mb-4 text-gray-600'>The event you're trying to manage doesn't exist.</p>
          <button
            onClick={() => router.back()}
            className='rounded-lg bg-red-500 px-4 py-2 text-white hover:bg-red-600'
          >
            Go Back
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
      iconBg: 'bg-green-100',
      iconColor: '',
      placeholder: '$username',
      hint: 'Enter as $username',
    },
    {
      key: 'venmo' as const,
      name: 'Venmo',
      icon: <VenmoSVGIcon className='h-6 w-6' />,
      iconBg: 'bg-blue-100',
      iconColor: '',
      placeholder: '@username',
      hint: 'Enter as @username',
    },
    {
      key: 'paypal' as const,
      name: 'PayPal',
      icon: <PayPalSVGIcon className='h-6 w-6' />,
      iconBg: 'bg-blue-100',
      iconColor: '',
      placeholder: 'username or email',
      hint: 'Username or email address',
    },
  ];

  const selectedCurrency = currencies.find(
    (c) => c.value === contributions.suggestedAmount?.currency
  );

  return (
    <div className='mx-auto min-h-screen max-w-full bg-white md:max-w-sm'>
      {/* TopBar handles header */}
      {/* Content */}
      <div className='space-y-6 p-4'>
        <div className='text-sm text-gray-500'>
          Set up payment methods and suggested contribution amounts for your event.
        </div>

        {/* Suggested Amount Section */}
        <div className='rounded-2xl bg-gray-50 p-6'>
          <div className='mb-4 flex items-center gap-3'>
            <div className='flex h-10 w-10 items-center justify-center rounded-xl bg-green-100'>
              <DollarSign className='h-5 w-5 text-green-600' />
            </div>
            <div>
              <h3 className='font-semibold text-gray-900'>Suggested Amount</h3>
              <p className='text-sm text-gray-600'>Guests can choose their own amount</p>
            </div>
          </div>

          <div className='space-y-4'>
            <div className='flex items-center gap-3'>
              <div className='rounded-lg bg-gray-100 px-3 py-2 font-medium text-gray-700'>
                $ USD
              </div>
              <input
                type='number'
                value={contributions.suggestedAmount?.amount || ''}
                onChange={(e) => handleAmountChange(Number(e.target.value))}
                placeholder='0.00'
                min='0'
                step='0.01'
                className='w-24 rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500'
              />
            </div>
            <p className='text-xs text-gray-500'>
              This is a suggested amount. Guests can contribute any amount they choose.
            </p>
          </div>
        </div>

        {/* Payment Methods Section */}
        <div className='space-y-4'>
          <h3 className='text-lg font-semibold text-gray-900'>Payment Methods</h3>

          {paymentMethods.map((method) => {
            const paymentData = contributions.paymentMethods[method.key];
            return (
              <div key={method.key} className='rounded-2xl border border-gray-200 bg-white p-4'>
                <div className='mb-3 flex items-center gap-3'>
                  <div
                    className={`h-10 w-10 ${method.iconBg} flex items-center justify-center rounded-xl`}
                  >
                    {method.icon}
                  </div>
                  <div className='flex-1'>
                    <h4 className='font-medium text-gray-900'>{method.name}</h4>
                    <p className='text-xs text-gray-500'>{method.hint}</p>
                  </div>
                  <button
                    onClick={() => handlePaymentMethodToggle(method.key)}
                    className={`h-6 w-10 rounded-full transition-colors ${
                      paymentData?.enabled ? 'bg-green-500' : 'bg-gray-300'
                    }`}
                  >
                    <div
                      className={`h-4 w-4 rounded-full bg-white transition-transform ${
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
                    className='w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500'
                  />
                )}
              </div>
            );
          })}
        </div>

        {/* Information Section */}
        <div className='rounded-2xl bg-blue-50 p-4'>
          <h4 className='mb-2 font-medium text-blue-900'>How Contributions Work</h4>
          <p className='text-sm text-blue-700'>
            Payment methods you enable will appear as buttons on your event page. When guests tap
            them, the respective app will open on their phone to complete the contribution.
          </p>
        </div>

        {/* Save Button */}
        <button
          onClick={() => void handleSave()}
          disabled={isSubmitting}
          className='w-full rounded-xl bg-red-500 py-4 text-base font-semibold text-white transition-colors hover:bg-red-600 disabled:cursor-not-allowed disabled:opacity-50'
        >
          {isSubmitting ? 'Saving...' : 'Save Changes'}
        </button>
      </div>
    </div>
  );
}
