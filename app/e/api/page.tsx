'use client';

import { Button } from '@/components/ui/button';
import { useTopBar } from '@/lib/stores/topbar-store';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function EventoAPIPage() {
  const { setTopBar } = useTopBar();

  // Set TopBar content
  useEffect(() => {
    setTopBar({
      title: 'API',
      subtitle: 'Developer documentation',
    });

    return () => {
      setTopBar({});
    };
  }, [setTopBar]);

  const router = useRouter();

  const handleGetAccess = () => {
    const title = 'Get Evento API access';
    const message =
      'I would like to request access to the Evento API.\n\nWhat I plan to use it for:\n\n[Please describe your use case and why you need API access]';

    router.push(
      `/e/contact?title=${encodeURIComponent(title)}&message=${encodeURIComponent(message)}`
    );
  };

  return (
    <div className='mx-auto flex min-h-screen max-w-full flex-col bg-white md:max-w-sm'>
      {/* Content */}
      <div className='flex-1 space-y-6 overflow-y-auto bg-gray-50 px-4 py-6'>
        {/* CTA Button */}
        <div className='rounded-2xl bg-white p-6'>
          <Button
            onClick={handleGetAccess}
            className='w-full rounded-xl bg-red-500 py-4 text-lg font-semibold text-white hover:bg-red-600'
          >
            Get API Access
          </Button>
        </div>

        {/* Description */}
        <div className='space-y-4 rounded-2xl bg-white p-6'>
          <h2 className='text-xl font-bold text-gray-900'>Build Your Own Integrations</h2>

          <p className='leading-relaxed text-gray-700'>
            With the Evento API, you can build your own native integrations that allow you to fully
            customize the UI while still providing your users, customers, friends, or community
            access to your latest events and all the information around them.
          </p>

          <div className='space-y-3'>
            <h3 className='font-semibold text-gray-900'>What you can do:</h3>
            <ul className='space-y-2 text-gray-700'>
              <li className='flex items-start gap-2'>
                <div className='mt-2 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-red-500'></div>
                <span>Access event data and details</span>
              </li>
              <li className='flex items-start gap-2'>
                <div className='mt-2 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-red-500'></div>
                <span>Create custom event displays</span>
              </li>
              <li className='flex items-start gap-2'>
                <div className='mt-2 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-red-500'></div>
                <span>Integrate with your existing systems</span>
              </li>
              <li className='flex items-start gap-2'>
                <div className='mt-2 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-red-500'></div>
                <span>Build custom notification systems</span>
              </li>
              <li className='flex items-start gap-2'>
                <div className='mt-2 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-red-500'></div>
                <span>Sync events across platforms</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Use Cases */}
        <div className='space-y-4 rounded-2xl bg-white p-6'>
          <h3 className='font-semibold text-gray-900'>Popular Use Cases</h3>

          <div className='space-y-4'>
            <div className='border-l-4 border-blue-500 pl-4'>
              <h4 className='font-medium text-gray-900'>Website Integration</h4>
              <p className='text-sm text-gray-600'>
                Display your events on your website with custom styling
              </p>
            </div>

            <div className='border-l-4 border-green-500 pl-4'>
              <h4 className='font-medium text-gray-900'>Mobile Apps</h4>
              <p className='text-sm text-gray-600'>
                Build native mobile experiences for your events
              </p>
            </div>

            <div className='border-l-4 border-purple-500 pl-4'>
              <h4 className='font-medium text-gray-900'>Community Platforms</h4>
              <p className='text-sm text-gray-600'>
                Integrate events into Discord, Slack, or other platforms
              </p>
            </div>

            <div className='border-l-4 border-red-500 pl-4'>
              <h4 className='font-medium text-gray-900'>Analytics & Reporting</h4>
              <p className='text-sm text-gray-600'>Build custom dashboards and reporting tools</p>
            </div>
          </div>
        </div>

        {/* Getting Started */}
        <div className='space-y-4 rounded-2xl bg-white p-6'>
          <h3 className='font-semibold text-gray-900'>Getting Started</h3>

          <div className='space-y-3'>
            <div className='flex items-start gap-3'>
              <div className='mt-0.5 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-red-100'>
                <span className='text-xs font-bold text-red-600'>1</span>
              </div>
              <div>
                <p className='font-medium text-gray-900'>Request Access</p>
                <p className='text-sm text-gray-600'>
                  Tell us about your use case and get approved
                </p>
              </div>
            </div>

            <div className='flex items-start gap-3'>
              <div className='mt-0.5 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-red-100'>
                <span className='text-xs font-bold text-red-600'>2</span>
              </div>
              <div>
                <p className='font-medium text-gray-900'>Get Your API Keys</p>
                <p className='text-sm text-gray-600'>Receive your authentication credentials</p>
              </div>
            </div>

            <div className='flex items-start gap-3'>
              <div className='mt-0.5 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-red-100'>
                <span className='text-xs font-bold text-red-600'>3</span>
              </div>
              <div>
                <p className='font-medium text-gray-900'>Start Building</p>
                <p className='text-sm text-gray-600'>Use our documentation to integrate the API</p>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom CTA */}
        <div className='rounded-2xl bg-gradient-to-r from-red-500 to-red-500 p-6 text-white'>
          <h3 className='mb-2 text-lg font-bold'>Ready to get started?</h3>
          <p className='mb-4 text-sm text-red-100'>
            Join other developers building amazing experiences with the Evento API
          </p>
          <Button
            onClick={handleGetAccess}
            className='w-full bg-white font-semibold text-red-600 hover:bg-gray-100'
          >
            Request API Access
          </Button>
        </div>
      </div>
    </div>
  );
}
