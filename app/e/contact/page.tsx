'use client';

import type React from 'react';

import { Button } from '@/components/ui/button';
import { useRequireAuth } from '@/lib/hooks/use-auth';
import { useContactSupport } from '@/lib/hooks/use-contact-support';
import { useTopBar } from '@/lib/stores/topbar-store';
import { toast } from '@/lib/utils/toast';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function ContactPage() {
  const { isLoading: isCheckingAuth } = useRequireAuth();
  const pathname = usePathname();
  const { setTopBarForRoute, applyRouteConfig, clearRoute } = useTopBar();

  // Set TopBar content
  useEffect(() => {
    applyRouteConfig(pathname);
    setTopBarForRoute(pathname, {
      title: 'Help & Support',
      subtitle: '',
      leftMode: 'menu',
      showAvatar: false,
      centerMode: 'title',
      buttons: [],
    });

    return () => {
      clearRoute(pathname);
    };
  }, [applyRouteConfig, setTopBarForRoute, clearRoute]);

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
      toast.error('Please fill in all required fields');
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
            toast.success("Message sent successfully! We'll get back to you soon.");
            setFormData({
              title: '',
              message: '',
            });
            router.back();
          },
          onError: () => {
            toast.error('Failed to send message. Please try again.');
          },
        }
      );
    } catch (_) {}
  };

  if (isCheckingAuth) {
    return (
      <div className='mx-auto flex min-h-screen max-w-full flex-col bg-white md:max-w-sm'>
        <div className='flex flex-1 items-center justify-center pb-20'>
          <div className='h-8 w-8 animate-spin rounded-full border-b-2 border-red-500'></div>
        </div>
      </div>
    );
  }

  return (
    <div className='mx-auto flex min-h-screen max-w-full flex-col bg-white md:max-w-sm'>
      {/* Header */}
      <div className='border-b border-gray-200'></div>

      {/* Form */}
      <form
        onSubmit={handleSubmit}
        className='flex-1 space-y-6 overflow-y-auto bg-gray-50 px-4 py-6'
      >
        {/* Title Field */}
        <div className='space-y-2 rounded-2xl bg-white p-4'>
          <label className='text-sm font-medium text-gray-700'>Subject *</label>
          <input
            type='text'
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            placeholder="What's this about?"
            className='w-full border-none bg-transparent text-lg font-medium text-gray-900 outline-none'
            required
          />
        </div>

        {/* Message Field */}
        <div className='space-y-2 rounded-2xl bg-white p-4'>
          <label className='text-sm font-medium text-gray-700'>Message *</label>
          <textarea
            value={formData.message}
            onChange={(e) => setFormData({ ...formData, message: e.target.value })}
            placeholder='Tell us more about your issue or question...'
            rows={6}
            className='w-full resize-none border-none bg-transparent text-gray-900 outline-none'
            required
          />
        </div>

        {/* File Upload */}
        {/* <div className="space-y-2 rounded-2xl bg-white p-4">
          <label className="text-sm font-medium text-gray-700">
            Attachment (optional)
          </label>

          {attachedFile ? (
            <div className="flex items-center justify-between rounded-xl border border-gray-200 bg-gray-50 p-3">
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-100">
                  <Upload className="h-4 w-4 text-red-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {attachedFile.name}
                  </p>
                  <p className="text-xs text-gray-500">
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
              <div className="flex items-center justify-center rounded-xl border-2 border-dashed border-gray-300 p-6 transition-colors hover:border-red-500">
                <div className="text-center">
                  <Upload className="mx-auto mb-2 h-8 w-8 text-gray-400" />
                  <p className="text-sm text-gray-600">
                    Click to upload a file or screenshot
                  </p>
                  <p className="mt-1 text-xs text-gray-500">
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
            className='w-full rounded-xl bg-red-500 py-3 font-medium text-white hover:bg-red-600 disabled:opacity-50'
          >
            {contactMutation.isPending ? (
              <div className='flex items-center gap-2'>
                <div className='h-4 w-4 animate-spin rounded-full border-b-2 border-white'></div>
                Sending...
              </div>
            ) : (
              'Send Message'
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
