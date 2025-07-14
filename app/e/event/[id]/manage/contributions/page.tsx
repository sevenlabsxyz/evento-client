'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, DollarSign, Smartphone, Bitcoin, CreditCard } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getEventById } from '@/lib/data/sample-events';

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
    bitcoin?: PaymentMethod;
    venmo?: PaymentMethod;
    paypal?: PaymentMethod;
  };
}

export default function ContributionsManagementPage() {
  const params = useParams();
  const router = useRouter();
  const eventId = params.id as string;
  
  // Get existing event data
  const existingEvent = getEventById(eventId);
  
  if (!existingEvent) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Event Not Found</h1>
          <p className="text-gray-600 mb-4">The event you're trying to manage doesn't exist.</p>
          <button
            onClick={() => router.back()}
            className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  // State for contributions
  const [contributions, setContributions] = useState<EventContributions>({
    enabled: false,
    suggestedAmount: {
      amount: 0,
      currency: 'USD'
    },
    paymentMethods: {
      cashApp: { enabled: false, value: '' },
      bitcoin: { enabled: false, value: '' },
      venmo: { enabled: false, value: '' },
      paypal: { enabled: false, value: '' }
    }
  });

  const currencies = [
    { value: 'USD', label: '$', name: 'US Dollar' },
    { value: 'EUR', label: '€', name: 'Euro' },
    { value: 'GBP', label: '£', name: 'British Pound' },
    { value: 'BTC', label: '₿', name: 'Bitcoin' }
  ];

  const handleAmountChange = (amount: number) => {
    setContributions(prev => ({
      ...prev,
      suggestedAmount: {
        ...prev.suggestedAmount!,
        amount
      }
    }));
  };

  const handleCurrencyChange = (currency: string) => {
    setContributions(prev => ({
      ...prev,
      suggestedAmount: {
        ...prev.suggestedAmount!,
        currency
      }
    }));
  };

  const handlePaymentMethodToggle = (method: keyof EventContributions['paymentMethods']) => {
    setContributions(prev => ({
      ...prev,
      paymentMethods: {
        ...prev.paymentMethods,
        [method]: {
          ...prev.paymentMethods[method]!,
          enabled: !prev.paymentMethods[method]!.enabled
        }
      }
    }));
  };

  const handlePaymentMethodValue = (method: keyof EventContributions['paymentMethods'], value: string) => {
    // Auto-format values
    let formattedValue = value;
    if (method === 'cashApp' && value && !value.startsWith('$')) {
      formattedValue = '$' + value.replace(/^\$/, '');
    } else if (method === 'venmo' && value && !value.startsWith('@')) {
      formattedValue = '@' + value.replace(/^@/, '');
    }

    setContributions(prev => ({
      ...prev,
      paymentMethods: {
        ...prev.paymentMethods,
        [method]: {
          ...prev.paymentMethods[method]!,
          value: formattedValue
        }
      }
    }));
  };

  const handleSave = () => {
    console.log('Saving contributions:', contributions);
    // In a real app, save to backend
    router.back();
  };

  const paymentMethods = [
    {
      key: 'cashApp' as const,
      name: 'Cash App',
      icon: <Smartphone className="w-6 h-6" />,
      iconBg: 'bg-green-100',
      iconColor: 'text-green-600',
      placeholder: '$username',
      hint: 'Enter as $username'
    },
    {
      key: 'bitcoin' as const,
      name: 'Bitcoin Lightning',
      icon: <Bitcoin className="w-6 h-6" />,
      iconBg: 'bg-orange-100',
      iconColor: 'text-orange-600',
      placeholder: 'username@domain.com',
      hint: 'Lightning address format'
    },
    {
      key: 'venmo' as const,
      name: 'Venmo',
      icon: <Smartphone className="w-6 h-6" />,
      iconBg: 'bg-blue-100',
      iconColor: 'text-blue-600',
      placeholder: '@username',
      hint: 'Enter as @username'
    },
    {
      key: 'paypal' as const,
      name: 'PayPal',
      icon: <CreditCard className="w-6 h-6" />,
      iconBg: 'bg-blue-100',
      iconColor: 'text-blue-600',
      placeholder: 'username or email',
      hint: 'Username or email address'
    }
  ];

  const selectedCurrency = currencies.find(c => c.value === contributions.suggestedAmount?.currency);

  return (
    <div className="md:max-w-sm max-w-full mx-auto bg-white min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-100">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.back()}
            className="p-2 hover:bg-gray-100 rounded-full"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-xl font-semibold">Contributions</h1>
        </div>
        <Button
          onClick={handleSave}
          className="px-6 py-2 bg-black hover:bg-gray-800 text-white rounded-full font-medium"
        >
          Save
        </Button>
      </div>

      {/* Content */}
      <div className="p-4 space-y-6">
        <div className="text-sm text-gray-500">
          Set up payment methods and suggested contribution amounts for your event.
        </div>

        {/* Suggested Amount Section */}
        <div className="bg-gray-50 rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Suggested Amount</h3>
              <p className="text-sm text-gray-600">Guests can choose their own amount</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex gap-3">
              <select
                value={contributions.suggestedAmount?.currency}
                onChange={(e) => handleCurrencyChange(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                {currencies.map(currency => (
                  <option key={currency.value} value={currency.value}>
                    {currency.label} {currency.name}
                  </option>
                ))}
              </select>
              <input
                type="number"
                value={contributions.suggestedAmount?.amount || ''}
                onChange={(e) => handleAmountChange(Number(e.target.value))}
                placeholder="0.00"
                min="0"
                step="0.01"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
            <p className="text-xs text-gray-500">
              This is a suggested amount. Guests can contribute any amount they choose.
            </p>
          </div>
        </div>

        {/* Payment Methods Section */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900">Payment Methods</h3>
          
          {paymentMethods.map((method) => {
            const paymentData = contributions.paymentMethods[method.key];
            return (
              <div key={method.key} className="bg-white border border-gray-200 rounded-2xl p-4">
                <div className="flex items-center gap-3 mb-3">
                  <div className={`w-10 h-10 ${method.iconBg} rounded-xl flex items-center justify-center`}>
                    <div className={method.iconColor}>
                      {method.icon}
                    </div>
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900">{method.name}</h4>
                    <p className="text-xs text-gray-500">{method.hint}</p>
                  </div>
                  <button
                    onClick={() => handlePaymentMethodToggle(method.key)}
                    className={`w-10 h-6 rounded-full transition-colors ${
                      paymentData?.enabled ? 'bg-green-500' : 'bg-gray-300'
                    }`}
                  >
                    <div
                      className={`w-4 h-4 bg-white rounded-full transition-transform ${
                        paymentData?.enabled ? 'translate-x-5' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
                
                {paymentData?.enabled && (
                  <input
                    type="text"
                    value={paymentData.value}
                    onChange={(e) => handlePaymentMethodValue(method.key, e.target.value)}
                    placeholder={method.placeholder}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                )}
              </div>
            );
          })}
        </div>

        {/* Information Section */}
        <div className="p-4 bg-blue-50 rounded-2xl">
          <h4 className="font-medium text-blue-900 mb-2">How Contributions Work</h4>
          <p className="text-sm text-blue-700">
            Payment methods you enable will appear as buttons on your event page. 
            When guests tap them, the respective app will open on their phone to complete the contribution.
          </p>
        </div>
      </div>
    </div>
  );
}