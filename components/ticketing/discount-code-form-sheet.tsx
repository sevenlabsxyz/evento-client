'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { MasterScrollableSheet } from '@/components/ui/master-scrollable-sheet';
import { useCreateDiscountCode } from '@/lib/hooks/use-discount-codes';
import { toast } from '@/lib/utils/toast';
import { useState } from 'react';

interface DiscountCodeFormSheetProps {
  eventId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DiscountCodeFormSheet({ eventId, open, onOpenChange }: DiscountCodeFormSheetProps) {
  const createMutation = useCreateDiscountCode(eventId);

  const [code, setCode] = useState('');
  const [percentage, setPercentage] = useState('');
  const [usageLimit, setUsageLimit] = useState('');

  const handleSubmit = async () => {
    try {
      await createMutation.mutateAsync({
        code: code.toUpperCase(),
        percentage: parseInt(percentage, 10),
        usage_limit: parseInt(usageLimit, 10),
      });
      setCode('');
      setPercentage('');
      setUsageLimit('');
      onOpenChange(false);
      toast.success('Discount code created');
    } catch (error: any) {
      toast.error(error.message || 'Failed to create discount code');
    }
  };

  const canSubmit = code && percentage && usageLimit && !createMutation.isPending;

  return (
    <MasterScrollableSheet title='Create Discount Code' open={open} onOpenChange={onOpenChange}>
      <div className='space-y-6 px-4 pb-4'>
        {/* Code */}
        <div className='space-y-2'>
          <Label htmlFor='code'>Code</Label>
          <Input
            id='code'
            placeholder='SUMMER25'
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            className='font-mono'
          />
          <p className='text-xs text-gray-500'>Customers will enter this code at checkout</p>
        </div>

        {/* Percentage */}
        <div className='space-y-2'>
          <Label htmlFor='percentage'>Discount Percentage</Label>
          <div className='relative'>
            <Input
              id='percentage'
              type='number'
              min='1'
              max='100'
              placeholder='25'
              value={percentage}
              onChange={(e) => setPercentage(e.target.value)}
              className='pr-8'
            />
            <span className='absolute right-3 top-1/2 -translate-y-1/2 text-gray-500'>%</span>
          </div>
          <p className='text-xs text-gray-500'>Use 100 for free tickets (comps)</p>
        </div>

        {/* Usage Limit */}
        <div className='space-y-2'>
          <Label htmlFor='limit'>Usage Limit</Label>
          <Input
            id='limit'
            type='number'
            min='1'
            placeholder='100'
            value={usageLimit}
            onChange={(e) => setUsageLimit(e.target.value)}
          />
          <p className='text-xs text-gray-500'>Maximum number of times this code can be used</p>
        </div>

        {/* Actions */}
        <div className='flex gap-3 pt-4'>
          <Button
            variant='outline'
            className='flex-1 rounded-full'
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button className='flex-1 rounded-full' onClick={handleSubmit} disabled={!canSubmit}>
            Create Code
          </Button>
        </div>
      </div>
    </MasterScrollableSheet>
  );
}
