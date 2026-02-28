'use client';

import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  useCreateEventCampaign,
  useEventCampaign,
  useUpdateEventCampaign,
} from '@/lib/hooks/use-event-campaign';
import { campaignFormSchema, type CampaignFormData } from '@/lib/schemas/campaign';
import { useTopBar } from '@/lib/stores/topbar-store';
import type { ApiError } from '@/lib/types/api';
import { toast } from '@/lib/utils/toast';
import { zodResolver } from '@hookform/resolvers/zod';
import { Check, Info, MessageCircle, Zap } from 'lucide-react';
import { useParams, usePathname, useRouter } from 'next/navigation';
import { useCallback, useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';

export default function CrowdfundingManagementPage() {
  const { setTopBarForRoute, clearRoute, applyRouteConfig } = useTopBar();
  const params = useParams();
  const pathname = usePathname();
  const router = useRouter();
  const eventId = params.id as string;

  const { data: campaign, isLoading, error } = useEventCampaign(eventId);
  const createCampaign = useCreateEventCampaign(eventId);
  const updateCampaign = useUpdateEventCampaign(eventId);

  const isCampaignMissingError = (value: unknown): value is ApiError => {
    if (!value || typeof value !== 'object') {
      return false;
    }

    const candidate = value as ApiError;
    const statusIsNotFound = candidate.status === 404;
    const statusIsLegacyNotFound =
      candidate.status === 400 && candidate.message === 'Campaign not found.';

    return statusIsNotFound || statusIsLegacyNotFound;
  };

  const isMissingCampaign = isCampaignMissingError(error);
  const isUpdate = !!campaign;
  const isMutating = createCampaign.isPending || updateCampaign.isPending;

  const form = useForm<CampaignFormData>({
    resolver: zodResolver(campaignFormSchema),
    defaultValues: {
      title: '',
      description: '',
      goal_sats: null,
      visibility: 'public',
      status: 'active',
    },
  });

  // Populate form when campaign data arrives
  useEffect(() => {
    if (campaign) {
      form.reset({
        title: campaign.title ?? '',
        description: campaign.description ?? '',
        goal_sats: campaign.goal_sats ?? null,
        visibility: campaign.visibility ?? 'public',
        status: campaign.status === 'paused' ? 'paused' : 'active',
      });
    }
  }, [campaign, form]);

  const handleSave = useCallback(
    async (data: CampaignFormData) => {
      try {
        const payload = {
          title: data.title,
          description: data.description ? data.description : null,
          goalSats: data.goal_sats ?? null,
          visibility: data.visibility,
          status: data.status,
        };

        if (isUpdate) {
          await updateCampaign.mutateAsync(payload);
          toast.success('Campaign updated successfully!');
        } else {
          await createCampaign.mutateAsync(payload);
          toast.success('Campaign created successfully!');
        }

        router.push(`/e/${eventId}/manage`);
      } catch (err: any) {
        toast.error(err?.message || `Failed to ${isUpdate ? 'update' : 'create'} campaign`);
      }
    },
    [isUpdate, updateCampaign, createCampaign, eventId, router]
  );

  // Memoize topbar save handler to avoid unnecessary re-renders
  const topBarSaveHandler = useMemo(
    () => () => void form.handleSubmit(handleSave)(),
    [form, handleSave]
  );

  // Configure TopBar
  useEffect(() => {
    applyRouteConfig(pathname);
    setTopBarForRoute(pathname, {
      title: 'Crowdfunding',
      leftMode: 'back',
      centerMode: 'title',
      showAvatar: false,
      buttons: [
        {
          id: 'save-crowdfunding',
          icon: Check,
          onClick: topBarSaveHandler,
          label: 'Save',
          disabled: isMutating,
        },
      ],
    });

    return () => {
      clearRoute(pathname);
    };
  }, [setTopBarForRoute, clearRoute, isMutating, applyRouteConfig, pathname, topBarSaveHandler]);

  if (isLoading) {
    return (
      <div className='mx-auto min-h-screen max-w-full bg-white md:max-w-sm'>
        <div className='space-y-6 p-4'>
          <Skeleton className='h-4 w-3/4' />
          <div className='rounded-2xl bg-gray-50 p-6'>
            <div className='mb-4 flex items-center gap-3'>
              <Skeleton className='h-12 w-12 rounded-xl' />
              <div className='space-y-2'>
                <Skeleton className='h-5 w-24' />
                <Skeleton className='h-4 w-40' />
              </div>
            </div>
            <div className='space-y-4'>
              <Skeleton className='h-12 w-full rounded-xl' />
              <Skeleton className='h-24 w-full rounded-xl' />
              <Skeleton className='h-12 w-full rounded-xl' />
              <Skeleton className='h-12 w-full rounded-xl' />
            </div>
          </div>
          <div className='rounded-2xl bg-amber-50 p-4'>
            <Skeleton className='mb-2 h-5 w-32' />
            <Skeleton className='h-4 w-full' />
            <Skeleton className='mt-1 h-4 w-3/4' />
          </div>
        </div>
      </div>
    );
  }

  if (error && !isMissingCampaign) {
    return (
      <div className='flex min-h-screen items-center justify-center bg-gray-50'>
        <div className='text-center'>
          <MessageCircle className='mx-auto mb-4 h-8 w-8 text-red-500' />
          <p className='text-gray-600'>Could not load campaign settings</p>
        </div>
      </div>
    );
  }

  return (
    <div className='mx-auto min-h-screen max-w-full bg-white md:max-w-sm'>
      <div className='space-y-6 p-4'>
        <div className='text-sm text-gray-500'>
          {isUpdate
            ? 'Update your crowdfunding campaign settings below.'
            : 'Set up a Lightning crowdfunding campaign for your event.'}
        </div>

        {/* Campaign Settings */}
        <form onSubmit={form.handleSubmit(handleSave)} className='space-y-6'>
          {/* Title */}
          <div className='rounded-2xl bg-gray-50 p-6'>
            <div className='mb-4 flex items-center gap-3'>
              <div className='flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100'>
                <Zap className='h-5 w-5 text-amber-600' />
              </div>
              <div>
                <h3 className='font-semibold text-gray-900'>Campaign Details</h3>
                <p className='text-sm text-gray-600'>Name and describe your campaign</p>
              </div>
            </div>

            <div className='space-y-4'>
              {/* Title field */}
              <div className='space-y-2'>
                <label htmlFor='campaign-title' className='text-sm font-medium text-gray-700'>
                  Title <span className='text-red-500'>*</span>
                </label>
                <input
                  id='campaign-title'
                  type='text'
                  {...form.register('title')}
                  placeholder='e.g. Help fund our event'
                  maxLength={200}
                  className='w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-amber-500'
                />
                {form.formState.errors.title && (
                  <p className='text-sm text-red-500'>{form.formState.errors.title.message}</p>
                )}
              </div>

              {/* Description field */}
              <div className='space-y-2'>
                <label
                  htmlFor='campaign-description'
                  className='text-sm font-medium text-gray-700'
                >
                  Description
                </label>
                <textarea
                  id='campaign-description'
                  {...form.register('description')}
                  placeholder='Tell supporters what this campaign is for...'
                  rows={3}
                  className='w-full resize-none rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-amber-500'
                />
              </div>
            </div>
          </div>

          {/* Goal */}
          <div className='rounded-2xl bg-gray-50 p-6'>
            <div className='space-y-2'>
              <label htmlFor='campaign-goal' className='text-sm font-medium text-gray-700'>
                Goal (sats)
              </label>
              <div className='flex items-center gap-3'>
                <div className='rounded-lg bg-gray-100 px-3 py-2 font-medium text-gray-700'>
                  sats
                </div>
                <input
                  id='campaign-goal'
                  type='number'
                  {...form.register('goal_sats', { valueAsNumber: true })}
                  placeholder='Optional'
                  min='1'
                  step='1'
                  className='w-32 rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-amber-500'
                />
              </div>
              <p className='text-xs text-gray-500'>
                Leave empty for an open-ended campaign with no specific target.
              </p>
              {form.formState.errors.goal_sats && (
                <p className='text-sm text-red-500'>{form.formState.errors.goal_sats.message}</p>
              )}
            </div>
          </div>

          {/* Visibility */}
          <div className='rounded-2xl bg-gray-50 p-6'>
            <div className='space-y-2'>
              <label className='text-sm font-medium text-gray-700'>Visibility</label>
              <div className='flex gap-3'>
                {(['public', 'private'] as const).map((option) => (
                  <button
                    key={option}
                    type='button'
                    onClick={() => form.setValue('visibility', option, { shouldValidate: true })}
                    className={`flex-1 rounded-lg border px-4 py-2 text-sm font-medium transition-colors ${
                      form.watch('visibility') === option
                        ? 'border-amber-500 bg-amber-50 text-amber-700'
                        : 'border-gray-300 bg-white text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    {option === 'public' ? 'Public' : 'Private'}
                  </button>
                ))}
              </div>
              <p className='text-xs text-gray-500'>
                {form.watch('visibility') === 'public'
                  ? 'Anyone can view and contribute to this campaign.'
                  : 'Only people with the link can view and contribute.'}
              </p>
            </div>
          </div>

          {/* Status */}
          <div className='rounded-2xl bg-gray-50 p-6'>
            <div className='space-y-2'>
              <label className='text-sm font-medium text-gray-700'>Status</label>
              <div className='flex gap-3'>
                {(['active', 'paused'] as const).map((option) => (
                  <button
                    key={option}
                    type='button'
                    onClick={() => form.setValue('status', option, { shouldValidate: true })}
                    className={`flex-1 rounded-lg border px-4 py-2 text-sm font-medium transition-colors ${
                      form.watch('status') === option
                        ? 'border-amber-500 bg-amber-50 text-amber-700'
                        : 'border-gray-300 bg-white text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    {option === 'active' ? 'Active' : 'Paused'}
                  </button>
                ))}
              </div>
              <p className='text-xs text-gray-500'>
                {form.watch('status') === 'active'
                  ? 'Campaign is accepting pledges.'
                  : 'Campaign is paused and not accepting new pledges.'}
              </p>
            </div>
          </div>

          {/* Destination Address (read-only) */}
          <div className='rounded-2xl border border-amber-200 bg-amber-50 p-4'>
            <div className='mb-2 flex items-center gap-2'>
              <Info className='h-4 w-4 text-amber-700' />
              <h4 className='font-medium text-amber-900'>Payment Destination</h4>
            </div>
            <p className='text-sm text-amber-700'>
              Funds are sent directly to your Lightning address. The destination is automatically
              set to your account&apos;s Lightning address and cannot be changed.
            </p>
            {campaign?.destination_address && (
              <div className='mt-3 rounded-lg bg-amber-100/50 px-3 py-2'>
                <p className='text-xs font-medium text-amber-800'>Current destination</p>
                <p className='font-mono text-sm text-amber-900'>{campaign.destination_address}</p>
              </div>
            )}
          </div>

          {/* Progress (only when campaign exists) */}
          {isUpdate && campaign && (
            <div className='rounded-2xl bg-gray-50 p-6'>
              <h4 className='mb-3 font-semibold text-gray-900'>Campaign Progress</h4>
              <div className='space-y-2'>
                <div className='flex justify-between text-sm'>
                  <span className='text-gray-600'>Raised</span>
                  <span className='font-medium text-gray-900'>
                    {campaign.raised_sats.toLocaleString()} sats
                  </span>
                </div>
                {campaign.goal_sats && (
                  <>
                    <div className='flex justify-between text-sm'>
                      <span className='text-gray-600'>Goal</span>
                      <span className='font-medium text-gray-900'>
                        {campaign.goal_sats.toLocaleString()} sats
                      </span>
                    </div>
                    <div className='h-2 overflow-hidden rounded-full bg-gray-200'>
                      <div
                        className='h-full rounded-full bg-amber-500 transition-all'
                        style={{ width: `${Math.min(campaign.progressPercent, 100)}%` }}
                      />
                    </div>
                    <p className='text-xs text-gray-500'>
                      {campaign.progressPercent.toFixed(1)}% of goal reached
                    </p>
                  </>
                )}
                <div className='flex justify-between text-sm'>
                  <span className='text-gray-600'>Pledges</span>
                  <span className='font-medium text-gray-900'>{campaign.pledge_count}</span>
                </div>
              </div>
            </div>
          )}

          {/* Save Button */}
          <Button
            type='submit'
            className='h-12 w-full bg-amber-600 text-base font-semibold text-white hover:bg-amber-700'
            disabled={isMutating}
          >
            {isMutating
              ? 'Saving...'
              : isUpdate
                ? 'Update Campaign'
                : 'Create Campaign'}
          </Button>
        </form>
      </div>
    </div>
  );
}
