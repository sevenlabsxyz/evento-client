'use client';

import type React from 'react';

import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useRequireAuth } from '@/lib/hooks/use-auth';
import { useContactSupport } from '@/lib/hooks/use-contact-support';
import { useTopBar } from '@/lib/stores/topbar-store';
import { toast } from '@/lib/utils/toast';
import { useTranslations } from 'next-intl';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function ContactPage() {
  const t = useTranslations('misc.contact');
  const { isLoading: isCheckingAuth } = useRequireAuth();
  const pathname = usePathname();
  const { setTopBarForRoute, applyRouteConfig, clearRoute } = useTopBar();

  // Set TopBar content
  useEffect(() => {
    applyRouteConfig(pathname);
    setTopBarForRoute(pathname, {
      title: t('topBarTitle'),
      subtitle: '',
      leftMode: 'menu',
      showAvatar: false,
      centerMode: 'title',
      buttons: [],
    });

    return () => {
      clearRoute(pathname);
    };
  }, [applyRouteConfig, setTopBarForRoute, clearRoute, t]);

  const router = useRouter();
  const prefilledTitle = useSearchParams().get('title') ?? '';
  const prefilledMessage = useSearchParams().get('message') ?? '';

  const [formData, setFormData] = useState({
    title: prefilledTitle,
    message: prefilledMessage,
  });
  const contactMutation = useContactSupport();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title.trim() || !formData.message.trim()) {
      toast.error(t('requiredFields'));
      return;
    }

    try {
      await contactMutation.mutateAsync(
        {
          subject: formData.title.trim(),
          message: formData.message.trim(),
        },
        {
          onSuccess: () => {
            toast.success(t('sent'));
            setFormData({
              title: '',
              message: '',
            });
            router.back();
          },
          onError: () => {
            toast.error(t('sendFailed'));
          },
        }
      );
    } catch (_) {}
  };

  if (isCheckingAuth) {
    return (
      <div className='mx-auto flex min-h-screen max-w-full flex-col bg-white dark:bg-neutral-900 md:max-w-sm'>
        {/* Contact Page Loading Skeleton */}
        <div className='flex-1 space-y-6 overflow-y-auto bg-gray-50 px-4 py-6 dark:bg-neutral-950'>
          {/* Title Field Skeleton */}
          <div className='space-y-2 rounded-2xl bg-white p-4 dark:bg-neutral-900'>
            <Skeleton className='h-4 w-24' />
            <Skeleton className='h-7 w-3/4' />
          </div>

          {/* Message Field Skeleton */}
          <div className='space-y-2 rounded-2xl bg-white p-4 dark:bg-neutral-900'>
            <Skeleton className='h-4 w-24' />
            <div className='space-y-2'>
              <Skeleton className='h-4 w-full' />
              <Skeleton className='h-4 w-11/12' />
              <Skeleton className='h-4 w-10/12' />
              <Skeleton className='h-4 w-9/12' />
            </div>
          </div>

          {/* Submit Button Skeleton */}
          <div className='pt-4'>
            <Skeleton className='h-11 w-full rounded-xl' />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className='mx-auto flex min-h-screen max-w-full flex-col bg-white dark:bg-neutral-900 md:max-w-sm'>
      {/* Header */}
      <div className='border-b border-gray-200 dark:border-neutral-800'></div>

      {/* Form */}
      <form
        onSubmit={handleSubmit}
        className='flex-1 space-y-6 overflow-y-auto bg-gray-50 px-4 py-6 dark:bg-neutral-950'
      >
        {/* Title Field */}
        <div className='space-y-2 rounded-2xl bg-white p-4 dark:bg-neutral-900'>
          <label className='text-sm font-medium text-gray-700 dark:text-neutral-300'>
            {t('subject')}
          </label>
          <input
            type='text'
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            placeholder={t('subjectPlaceholder')}
            className='w-full border-none bg-transparent text-lg font-medium text-gray-900 outline-none dark:text-neutral-100 dark:placeholder:text-neutral-500'
            required
          />
        </div>

        {/* Message Field */}
        <div className='space-y-2 rounded-2xl bg-white p-4 dark:bg-neutral-900'>
          <label className='text-sm font-medium text-gray-700 dark:text-neutral-300'>
            {t('message')}
          </label>
          <textarea
            value={formData.message}
            onChange={(e) => setFormData({ ...formData, message: e.target.value })}
            placeholder={t('messagePlaceholder')}
            rows={6}
            className='w-full resize-none border-none bg-transparent text-gray-900 outline-none dark:text-neutral-100 dark:placeholder:text-neutral-500'
            required
          />
        </div>

        {/* File Upload */}
        {/* <div className="space-y-2 rounded-2xl bg-white dark:bg-neutral-900 p-4">
          <label className="text-sm font-medium text-gray-700 dark:text-neutral-300">
            Attachment (optional)
          </label>

          {attachedFile ? (
            <div className="flex items-center justify-between rounded-xl border border-gray-200 dark:border-neutral-800 bg-gray-50 dark:bg-neutral-950 p-3">
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-100 dark:bg-red-950/60">
                  <Upload className="h-4 w-4 text-red-600 dark:text-red-400" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-neutral-100">
                    {attachedFile.name}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-neutral-400">
                    {(attachedFile.size / 1024).toFixed(1)} KB
                  </p>
                </div>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={removeFile}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <div className="relative">
              <input
                type="file"
                onChange={handleFileUpload}
                accept="image/*,.pdf,.doc,.docx,.txt"
                className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
              />
              <div className="flex items-center justify-center rounded-xl border-2 border-dashed border-gray-300 dark:border-neutral-700 p-6 transition-colors hover:border-red-500">
                <div className="text-center">
                  <Upload className="mx-auto mb-2 h-8 w-8 text-gray-400 dark:text-neutral-500" />
                  <p className="text-sm text-gray-600 dark:text-neutral-400">
                    Click to upload a file or screenshot
                  </p>
                  <p className="mt-1 text-xs text-gray-500 dark:text-neutral-400">
                    PNG, JPG, PDF, DOC up to 10MB
                  </p>
                </div>
              </div>
            </div>
          )}
        </div> */}

        {/* Submit Button */}
        <div className='pt-4'>
          <Button
            type='submit'
            disabled={contactMutation.isPending}
            className='w-full rounded-xl bg-red-500 py-3 font-medium text-white hover:bg-red-600 disabled:opacity-50 dark:bg-red-600 dark:hover:bg-red-700'
          >
            {contactMutation.isPending ? (
              <div className='flex items-center gap-2'>
                <div className='h-4 w-4 animate-spin rounded-full border-b-2 border-white'></div>
                {t('sending')}
              </div>
            ) : (
              t('send')
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
