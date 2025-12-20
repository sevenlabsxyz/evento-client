'use client';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Skeleton } from '@/components/ui/skeleton';
import { useDeleteDiscountCode, useDiscountCodes } from '@/lib/hooks/use-discount-codes';
import { toast } from '@/lib/utils/toast';
import { MoreVertical, Percent, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { DiscountCodeFormSheet } from './discount-code-form-sheet';

interface DiscountCodesSectionProps {
  eventId: string;
}

export function DiscountCodesSection({ eventId }: DiscountCodesSectionProps) {
  const { data: codes, isLoading } = useDiscountCodes(eventId);
  const deleteCode = useDeleteDiscountCode(eventId);
  const [sheetOpen, setSheetOpen] = useState(false);

  const handleDelete = async (codeId: string) => {
    try {
      await deleteCode.mutateAsync(codeId);
      toast.success('Discount code deleted');
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete discount code');
    }
  };

  if (isLoading) {
    return (
      <div className='space-y-3'>
        <Skeleton className='h-6 w-32' />
        <Skeleton className='h-16 w-full rounded-lg' />
        <Skeleton className='h-16 w-full rounded-lg' />
      </div>
    );
  }

  return (
    <div className='space-y-4'>
      {/* Header */}
      <div className='flex items-center justify-between'>
        <h3 className='text-lg font-medium'>Discount Codes</h3>
        <Button
          variant='outline'
          size='sm'
          onClick={() => setSheetOpen(true)}
          className='rounded-full'
        >
          <Plus className='mr-2 h-4 w-4' />
          Add Code
        </Button>
      </div>

      {/* Codes List */}
      {codes && codes.length > 0 ? (
        <div className='space-y-2'>
          {codes.map((code) => (
            <div
              key={code.id}
              className='flex items-center justify-between rounded-lg border border-gray-200 bg-white p-3'
            >
              <div className='flex items-center gap-3'>
                <div className='flex h-8 w-8 items-center justify-center rounded-full bg-gray-100'>
                  <Percent className='h-4 w-4 text-gray-600' />
                </div>
                <div>
                  <p className='font-mono text-sm font-medium text-gray-900'>{code.code}</p>
                  <p className='text-xs text-gray-500'>
                    {code.percentage}% off {'\u00B7'} {code.usage_count}/{code.usage_limit} used
                  </p>
                </div>
              </div>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant='ghost' size='icon' className='h-8 w-8 rounded-full'>
                    <MoreVertical className='h-4 w-4' />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align='end'>
                  <DropdownMenuItem onClick={() => handleDelete(code.id)} className='text-red-600'>
                    <Trash2 className='mr-2 h-4 w-4' />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          ))}
        </div>
      ) : (
        <div className='rounded-lg bg-gray-50 p-4 text-center text-sm text-gray-500'>
          No discount codes yet
        </div>
      )}

      {/* Create Sheet */}
      <DiscountCodeFormSheet eventId={eventId} open={sheetOpen} onOpenChange={setSheetOpen} />
    </div>
  );
}
