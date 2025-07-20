'use client';

import { useRequireAuth } from '@/lib/hooks/useAuth';
import { useTopBar } from '@/lib/stores/topbar-store';
import { Bug, Calendar, Shield, Sparkles, Zap } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function ChangelogPage() {
  const { isLoading: isCheckingAuth } = useRequireAuth();
  const { setTopBar } = useTopBar();

  // Set TopBar content
  useEffect(() => {
    setTopBar({
      title: 'Changelog',
      subtitle: "What's new in Evento",
    });

    return () => {
      setTopBar({ 
        title: '',
        subtitle: '',
      });
    };
  }, [setTopBar]);

  const router = useRouter();

  const changelogEntries = [
    {
      version: '3.4.6',
      date: 'January 13, 2025',
      type: 'update',
      changes: [
        {
          category: 'New Features',
          icon: <Sparkles className='h-4 w-4 text-blue-600' />,
          items: [
            'Added native share functionality for sharing Evento with friends',
            'Introduced comprehensive changelog page with version history',
            'Enhanced API access request flow with pre-filled contact forms',
          ],
        },
        {
          category: 'Improvements',
          icon: <Zap className='h-4 w-4 text-green-600' />,
          items: [
            'Improved page loading performance and eliminated white screen flashes',
            'Updated stats page to focus on events instead of trips',
            'Enhanced dropdown menus with language and currency selection',
          ],
        },
        {
          category: 'Bug Fixes',
          icon: <Bug className='h-4 w-4 text-red-600' />,
          items: [
            'Fixed infinite loop issue in contact form pre-filling',
            'Resolved navigation inconsistencies across pages',
            'Fixed version display to read from package.json',
          ],
        },
      ],
    },
    {
      version: '3.4.5',
      date: 'January 10, 2025',
      type: 'update',
      changes: [
        {
          category: 'New Features',
          icon: <Sparkles className='h-4 w-4 text-blue-600' />,
          items: [
            'Launched Evento API for custom integrations',
            'Added developer documentation portal',
            'Introduced help center with AI agent support',
          ],
        },
        {
          category: 'Security',
          icon: <Shield className='h-4 w-4 text-purple-600' />,
          items: [
            'Enhanced data encryption for user information',
            'Improved authentication flow security',
            'Added privacy controls for event sharing',
          ],
        },
      ],
    },
    {
      version: '3.4.4',
      date: 'January 5, 2025',
      type: 'update',
      changes: [
        {
          category: 'New Features',
          icon: <Sparkles className='h-4 w-4 text-blue-600' />,
          items: [
            'Added real-time calendar synchronization',
            'Introduced event categories and tagging system',
            'Enhanced notification system with customizable alerts',
          ],
        },
        {
          category: 'Improvements',
          icon: <Zap className='h-4 w-4 text-green-600' />,
          items: [
            'Improved event creation flow with better UX',
            'Enhanced search functionality across all events',
            'Optimized app performance for faster loading',
          ],
        },
      ],
    },
    {
      version: '3.4.3',
      date: 'December 28, 2024',
      type: 'hotfix',
      changes: [
        {
          category: 'Bug Fixes',
          icon: <Bug className='h-4 w-4 text-red-600' />,
          items: [
            'Fixed critical issue with event date calculations',
            'Resolved timezone handling for international events',
            'Fixed crash when uploading large image files',
          ],
        },
      ],
    },
    {
      version: '3.4.2',
      date: 'December 20, 2024',
      type: 'update',
      changes: [
        {
          category: 'New Features',
          icon: <Sparkles className='h-4 w-4 text-blue-600' />,
          items: [
            'Added social feed for discovering events from friends',
            'Introduced event analytics and statistics tracking',
            'Enhanced messaging system with group chat support',
          ],
        },
        {
          category: 'Improvements',
          icon: <Zap className='h-4 w-4 text-green-600' />,
          items: [
            'Redesigned settings page with better organization',
            'Improved onboarding flow for new users',
            'Enhanced accessibility features throughout the app',
          ],
        },
      ],
    },
  ];

  const getVersionBadgeColor = (type: string) => {
    switch (type) {
      case 'hotfix':
        return 'bg-red-100 text-red-800';
      case 'update':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
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

      {/* Content */}
      <div className='flex-1 space-y-6 overflow-y-auto bg-gray-50 px-4 py-6'>
        {changelogEntries.map((entry, index) => (
          <div key={entry.version} className='overflow-hidden rounded-2xl bg-white shadow-sm'>
            {/* Version Header */}
            <div className='border-b border-gray-100 p-4'>
              <div className='mb-2 flex items-center justify-between'>
                <div className='flex items-center gap-3'>
                  <h3 className='text-lg font-bold text-gray-900'>v{entry.version}</h3>
                  <span
                    className={`rounded-full px-2 py-1 text-xs font-medium ${getVersionBadgeColor(
                      entry.type
                    )}`}
                  >
                    {entry.type}
                  </span>
                </div>
                {index === 0 && (
                  <span className='rounded-full bg-red-100 px-2 py-1 text-xs font-medium text-red-800'>
                    Latest
                  </span>
                )}
              </div>
              <div className='flex items-center gap-2 text-sm text-gray-500'>
                <Calendar className='h-4 w-4' />
                <span>{entry.date}</span>
              </div>
            </div>

            {/* Changes */}
            <div className='space-y-4 p-4'>
              {entry.changes.map((changeCategory, categoryIndex) => (
                <div key={categoryIndex}>
                  <div className='mb-3 flex items-center gap-2'>
                    {changeCategory.icon}
                    <h4 className='font-semibold text-gray-900'>{changeCategory.category}</h4>
                  </div>
                  <ul className='ml-6 space-y-2'>
                    {changeCategory.items.map((item, itemIndex) => (
                      <li key={itemIndex} className='flex items-start gap-2 text-sm text-gray-700'>
                        <div className='mt-2 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-gray-400'></div>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        ))}

        {/* Footer */}
        <div className='py-6 text-center'>
          <p className='text-sm text-gray-500'>
            Want to suggest a feature or report a bug?{' '}
            <button
              onClick={() => router.push('/contact')}
              className='font-medium text-red-600 hover:underline'
            >
              Contact us
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
