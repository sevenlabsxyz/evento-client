'use client';

import { Button } from '@/components/ui/button';
import { EventoQRCode } from '@/components/ui/evento-qr-code';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { MasterScrollableSheet } from '@/components/ui/master-scrollable-sheet';
import { useCheckout, useOrderStatus } from '@/lib/hooks/use-checkout';
import { useValidateDiscountCode } from '@/lib/hooks/use-discount-codes';
import { CheckoutResponse, TicketType, ValidateDiscountResponse } from '@/lib/types/api';
import { toast } from '@/lib/utils/toast';
import { Check, CheckCircle2, Copy, Loader2, Tag, User, X } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';

interface SelectedItem {
  ticketType: TicketType;
  quantity: number;
}

interface CheckoutSheetProps {
  eventId: string;
  selectedItems: SelectedItem[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onComplete: () => void;
}

type CheckoutStep = 'assign' | 'discount' | 'payment' | 'success';

interface TicketAssignment {
  ticketTypeId: string;
  index: number;
  assignedEmail: string;
  isSelf: boolean;
}

// Format price helper
const formatPrice = (amount: number, currency: string) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(amount);

export function CheckoutSheet({
  eventId,
  selectedItems,
  open,
  onOpenChange,
  onComplete,
}: CheckoutSheetProps) {
  const [step, setStep] = useState<CheckoutStep>('assign');
  const [assignments, setAssignments] = useState<TicketAssignment[]>([]);
  const [discountCode, setDiscountCode] = useState('');
  const [appliedDiscount, setAppliedDiscount] = useState<ValidateDiscountResponse | null>(null);
  const [orderId, setOrderId] = useState<string | null>(null);
  const [checkoutData, setCheckoutData] = useState<CheckoutResponse | null>(null);

  const checkoutMutation = useCheckout(eventId);
  const validateDiscountMutation = useValidateDiscountCode(eventId);
  const { data: orderStatus } = useOrderStatus(orderId, { enabled: step === 'payment' });

  // Initialize assignments when sheet opens
  useEffect(() => {
    if (open && selectedItems.length > 0) {
      const newAssignments: TicketAssignment[] = [];
      selectedItems.forEach((item) => {
        for (let i = 0; i < item.quantity; i++) {
          newAssignments.push({
            ticketTypeId: item.ticketType.id,
            index: i,
            assignedEmail: '',
            isSelf: i === 0, // First ticket defaults to self
          });
        }
      });
      setAssignments(newAssignments);
      setStep('assign');
      setDiscountCode('');
      setAppliedDiscount(null);
      setOrderId(null);
      setCheckoutData(null);
    }
  }, [open, selectedItems]);

  // Watch for payment completion
  useEffect(() => {
    if (orderStatus?.status === 'paid') {
      setStep('success');
    } else if (orderStatus?.status === 'expired') {
      toast.error('Payment expired. Please try again.');
      onOpenChange(false);
    }
  }, [orderStatus?.status, onOpenChange]);

  const updateAssignment = (index: number, field: 'assignedEmail' | 'isSelf', value: any) => {
    setAssignments((prev) =>
      prev.map((a, i) => {
        if (i !== index) return a;
        if (field === 'isSelf') {
          return { ...a, isSelf: value, assignedEmail: value ? '' : a.assignedEmail };
        }
        return { ...a, [field]: value };
      })
    );
  };

  const getCurrency = () => selectedItems[0]?.ticketType.price_currency || 'USD';

  const calculateSubtotal = () =>
    selectedItems.reduce((sum, item) => sum + item.ticketType.price_amount * item.quantity, 0);

  const calculateDiscount = () => {
    if (!appliedDiscount) return 0;
    const subtotal = calculateSubtotal();
    return Math.round(((subtotal * appliedDiscount.percentage) / 100) * 100) / 100;
  };

  const calculateTotal = () => calculateSubtotal() - calculateDiscount();

  const handleApplyDiscount = async () => {
    if (!discountCode.trim()) return;

    try {
      const result = await validateDiscountMutation.mutateAsync(discountCode.trim().toUpperCase());
      setAppliedDiscount(result);
      toast.success(`Discount applied: ${result.percentage}% off`);
    } catch (error: any) {
      toast.error(error.message || 'Invalid discount code');
    }
  };

  const handleRemoveDiscount = () => {
    setAppliedDiscount(null);
    setDiscountCode('');
  };

  const handleProceedToPayment = async () => {
    const items = assignments.map((a) => ({
      ticketTypeId: a.ticketTypeId,
      ...(a.isSelf ? {} : { assignedEmail: a.assignedEmail }),
    }));

    try {
      const response = await checkoutMutation.mutateAsync({
        items,
        discountCodeId: appliedDiscount?.discountCodeId,
      });

      setCheckoutData(response);
      setOrderId(response.orderId);

      // If total is 0 (free after discount), skip to success
      if (response.totalAmount === 0) {
        setStep('success');
      } else {
        setStep('payment');
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to create order');
    }
  };

  const handleCopyInvoice = useCallback(() => {
    if (checkoutData?.invoice) {
      navigator.clipboard.writeText(checkoutData.invoice);
      toast.success('Invoice copied to clipboard');
    }
  }, [checkoutData?.invoice]);

  const handleComplete = () => {
    onComplete();
    onOpenChange(false);
  };

  const canProceedFromAssign = assignments.every(
    (a) => a.isSelf || (a.assignedEmail && a.assignedEmail.includes('@'))
  );

  const getStepTitle = () => {
    switch (step) {
      case 'assign':
        return 'Assign Tickets';
      case 'discount':
        return 'Order Summary';
      case 'payment':
        return 'Payment';
      case 'success':
        return 'Success!';
    }
  };

  return (
    <MasterScrollableSheet title={getStepTitle()} open={open} onOpenChange={onOpenChange}>
      <div className='space-y-6 px-4 pb-4'>
        {step === 'assign' && (
          <AssignStep
            assignments={assignments}
            selectedItems={selectedItems}
            onUpdateAssignment={updateAssignment}
            onContinue={() => setStep('discount')}
            canProceed={canProceedFromAssign}
          />
        )}

        {step === 'discount' && (
          <DiscountStep
            selectedItems={selectedItems}
            discountCode={discountCode}
            onDiscountCodeChange={setDiscountCode}
            appliedDiscount={appliedDiscount}
            onApplyDiscount={handleApplyDiscount}
            onRemoveDiscount={handleRemoveDiscount}
            isValidating={validateDiscountMutation.isPending}
            subtotal={calculateSubtotal()}
            discount={calculateDiscount()}
            total={calculateTotal()}
            currency={getCurrency()}
            onBack={() => setStep('assign')}
            onProceed={handleProceedToPayment}
            isProcessing={checkoutMutation.isPending}
          />
        )}

        {step === 'payment' && checkoutData && (
          <PaymentStep
            invoice={checkoutData.invoice!}
            totalSats={checkoutData.totalSats!}
            onCopyInvoice={handleCopyInvoice}
            isPending={orderStatus?.status === 'pending'}
          />
        )}

        {step === 'success' && <SuccessStep onComplete={handleComplete} />}
      </div>
    </MasterScrollableSheet>
  );
}

// Step Components
interface AssignStepProps {
  assignments: TicketAssignment[];
  selectedItems: SelectedItem[];
  onUpdateAssignment: (index: number, field: 'assignedEmail' | 'isSelf', value: any) => void;
  onContinue: () => void;
  canProceed: boolean;
}

function AssignStep({
  assignments,
  selectedItems,
  onUpdateAssignment,
  onContinue,
  canProceed,
}: AssignStepProps) {
  const getTicketTypeName = (ticketTypeId: string) =>
    selectedItems.find((item) => item.ticketType.id === ticketTypeId)?.ticketType.name || 'Ticket';

  return (
    <div className='space-y-4'>
      <p className='text-sm text-gray-500'>
        Assign each ticket to yourself or send to someone else.
      </p>

      <div className='space-y-4'>
        {assignments.map((assignment, index) => (
          <div key={`${assignment.ticketTypeId}-${assignment.index}`} className='space-y-2'>
            <Label className='text-sm font-medium'>
              {getTicketTypeName(assignment.ticketTypeId)}{' '}
              {assignments.filter((a) => a.ticketTypeId === assignment.ticketTypeId).length > 1 &&
                `#${assignment.index + 1}`}
            </Label>

            <div className='flex gap-2'>
              <Button
                variant={assignment.isSelf ? 'default' : 'outline'}
                size='sm'
                className='flex-1 rounded-full'
                onClick={() => onUpdateAssignment(index, 'isSelf', true)}
              >
                <User className='mr-2 h-4 w-4' />
                For Me
              </Button>
              <Button
                variant={!assignment.isSelf ? 'default' : 'outline'}
                size='sm'
                className='flex-1 rounded-full'
                onClick={() => onUpdateAssignment(index, 'isSelf', false)}
              >
                Send to Friend
              </Button>
            </div>

            {!assignment.isSelf && (
              <Input
                type='email'
                placeholder='friend@email.com'
                value={assignment.assignedEmail}
                onChange={(e) => onUpdateAssignment(index, 'assignedEmail', e.target.value)}
              />
            )}
          </div>
        ))}
      </div>

      <Button className='w-full rounded-full' onClick={onContinue} disabled={!canProceed}>
        Continue
      </Button>
    </div>
  );
}

interface DiscountStepProps {
  selectedItems: SelectedItem[];
  discountCode: string;
  onDiscountCodeChange: (code: string) => void;
  appliedDiscount: ValidateDiscountResponse | null;
  onApplyDiscount: () => void;
  onRemoveDiscount: () => void;
  isValidating: boolean;
  subtotal: number;
  discount: number;
  total: number;
  currency: string;
  onBack: () => void;
  onProceed: () => void;
  isProcessing: boolean;
}

function DiscountStep({
  selectedItems,
  discountCode,
  onDiscountCodeChange,
  appliedDiscount,
  onApplyDiscount,
  onRemoveDiscount,
  isValidating,
  subtotal,
  discount,
  total,
  currency,
  onBack,
  onProceed,
  isProcessing,
}: DiscountStepProps) {
  return (
    <div className='space-y-6'>
      {/* Order Items */}
      <div className='space-y-2'>
        {selectedItems.map((item) => (
          <div key={item.ticketType.id} className='flex justify-between text-sm'>
            <span>
              {item.ticketType.name} x{item.quantity}
            </span>
            <span>{formatPrice(item.ticketType.price_amount * item.quantity, currency)}</span>
          </div>
        ))}
      </div>

      {/* Discount Code Input */}
      {!appliedDiscount ? (
        <div className='space-y-2'>
          <Label>Discount Code</Label>
          <div className='flex gap-2'>
            <Input
              placeholder='Enter code'
              value={discountCode}
              onChange={(e) => onDiscountCodeChange(e.target.value.toUpperCase())}
              className='flex-1 font-mono'
            />
            <Button
              variant='outline'
              onClick={onApplyDiscount}
              disabled={!discountCode.trim() || isValidating}
            >
              {isValidating ? <Loader2 className='h-4 w-4 animate-spin' /> : 'Apply'}
            </Button>
          </div>
        </div>
      ) : (
        <div className='flex items-center justify-between rounded-lg bg-green-50 p-3'>
          <div className='flex items-center gap-2'>
            <Tag className='h-4 w-4 text-green-600' />
            <span className='text-sm font-medium text-green-700'>
              {appliedDiscount.code} (-{appliedDiscount.percentage}%)
            </span>
          </div>
          <Button variant='ghost' size='icon' className='h-8 w-8' onClick={onRemoveDiscount}>
            <X className='h-4 w-4' />
          </Button>
        </div>
      )}

      {/* Order Summary */}
      <div className='space-y-2 border-t border-gray-200 pt-4'>
        <div className='flex justify-between text-sm'>
          <span>Subtotal</span>
          <span>{formatPrice(subtotal, currency)}</span>
        </div>
        {discount > 0 && (
          <div className='flex justify-between text-sm text-green-600'>
            <span>Discount</span>
            <span>-{formatPrice(discount, currency)}</span>
          </div>
        )}
        <div className='flex justify-between font-semibold'>
          <span>Total</span>
          <span>{formatPrice(total, currency)}</span>
        </div>
      </div>

      {/* Actions */}
      <div className='flex gap-3'>
        <Button variant='outline' className='flex-1 rounded-full' onClick={onBack}>
          Back
        </Button>
        <Button className='flex-1 rounded-full' onClick={onProceed} disabled={isProcessing}>
          {isProcessing ? (
            <Loader2 className='mr-2 h-4 w-4 animate-spin' />
          ) : total === 0 ? (
            'Get Tickets'
          ) : (
            'Pay with Lightning'
          )}
        </Button>
      </div>
    </div>
  );
}

interface PaymentStepProps {
  invoice: string;
  totalSats: number;
  onCopyInvoice: () => void;
  isPending: boolean;
}

function PaymentStep({ invoice, totalSats, onCopyInvoice, isPending }: PaymentStepProps) {
  return (
    <div className='space-y-6'>
      <div className='text-center'>
        <p className='text-2xl font-bold'>{totalSats.toLocaleString()} sats</p>
        <p className='text-sm text-gray-500'>Scan with a Lightning wallet</p>
      </div>

      <div className='flex justify-center'>
        <EventoQRCode value={invoice} size={250} />
      </div>

      {isPending && (
        <div className='flex items-center justify-center gap-2 text-sm text-gray-500'>
          <Loader2 className='h-4 w-4 animate-spin' />
          <span>Waiting for payment...</span>
        </div>
      )}

      <Button variant='outline' className='w-full rounded-full' onClick={onCopyInvoice}>
        <Copy className='mr-2 h-4 w-4' />
        Copy Invoice
      </Button>

      <p className='text-center text-xs text-gray-400'>Invoice expires in 10 minutes</p>
    </div>
  );
}

interface SuccessStepProps {
  onComplete: () => void;
}

function SuccessStep({ onComplete }: SuccessStepProps) {
  return (
    <div className='space-y-6 text-center'>
      <div className='mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100'>
        <CheckCircle2 className='h-8 w-8 text-green-600' />
      </div>

      <div>
        <h3 className='text-lg font-semibold'>Payment Complete!</h3>
        <p className='mt-1 text-sm text-gray-500'>
          Your tickets are ready. Check your email for confirmation.
        </p>
      </div>

      <Button className='w-full rounded-full' onClick={onComplete}>
        <Check className='mr-2 h-4 w-4' />
        View My Tickets
      </Button>
    </div>
  );
}
