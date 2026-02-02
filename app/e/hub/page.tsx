'use client';

import { CircledIconButton } from '@/components/circled-icon-button';
import { MobileHeader } from '@/components/dashboard/mobile-header';
import { CohostInvitesSection } from '@/components/hub/cohost-invites-section';
import { EventInvitesSection } from '@/components/hub/event-invites-section';
import { ForYouSection } from '@/components/hub/for-you-section';
import { HubBlogGallery } from '@/components/hub/hub-blog-gallery';
import { MyEventsSection } from '@/components/hub/my-events-section';
import { Navbar } from '@/components/navbar';
import { Skeleton } from '@/components/ui/skeleton';
import { useRequireAuth } from '@/lib/hooks/use-auth';
import { useRequireOnboarding } from '@/lib/hooks/use-require-onboarding';
import { MessageCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function HubPage() {
  const router = useRouter();
  const { isLoading: isCheckingAuth } = useRequireAuth();
  const { isLoading: isCheckingOnboarding } = useRequireOnboarding();

  if (isCheckingAuth || isCheckingOnboarding) {
    return (
      <div className='flex min-h-screen flex-col bg-white'>
        <MobileHeader title='Evento Hub' />
        <div className='mx-auto h-full w-full max-w-full bg-white px-4 pb-24 pt-4 md:max-w-4xl'>
          {/* Welcome text */}
          <div className='mb-4'>
            <Skeleton className='h-5 w-48' />
          </div>
          {/* Sections */}
          <div className='flex flex-col gap-4'>
            <div className='rounded-2xl bg-white p-4'>
              <Skeleton className='mb-3 h-5 w-28' />
              <Skeleton className='h-16 w-full rounded-lg' />
            </div>
            <div className='rounded-2xl bg-white p-4'>
              <Skeleton className='mb-3 h-5 w-36' />
              <Skeleton className='h-16 w-full rounded-lg' />
            </div>
            <div className='rounded-2xl bg-white p-4'>
              <Skeleton className='mb-3 h-5 w-24' />
              <Skeleton className='h-24 w-full rounded-lg' />
            </div>
          </div>
        </div>
        <Navbar />
      </div>
    );
  }

  return (
    <>
      <MobileHeader
        title='Evento Hub'
        rightContent={
          <CircledIconButton icon={MessageCircle} onClick={() => router.push('/e/messages')} />
        }
      />
      <div className='mx-auto flex h-full w-full flex-col gap-6 bg-white px-4 pb-32 pt-4 md:max-w-4xl'>
        <CohostInvitesSection />
        <MyEventsSection />
        <EventInvitesSection />
        <ForYouSection />
        <HubBlogGallery />
      </div>
      <Navbar />
    </>
  );
}
