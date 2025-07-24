'use client';

import { SheetWithDetentFull } from '@/components/ui/sheet-with-detent-full';
import { Calendar, Sparkles, Zap } from 'lucide-react';

interface ChangelogSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ChangelogSheet({ open, onOpenChange }: ChangelogSheetProps) {
  const changelogEntries = [
    {
      version: '2.0.0',
      date: 'July 22, 2025',
      type: 'major',
      changes: [
        {
          category: 'New Evento Build',
          icon: <Sparkles className="h-4 w-4 text-blue-600" />,
          items: [
            'Launched completely redesigned Evento application built from the ground up',
            'Optimized specifically for mobile devices with improved touch interactions',
            'Achieved 10x performance improvement with new architecture and optimizations',
            'Added support for animated GIF event cover images',
          ],
        },
        {
          category: 'Improvements',
          icon: <Zap className="h-4 w-4 text-green-600" />,
          items: [
            'Redesigned user interface with modern, cleaner aesthetic',
            'Improved image loading and processing for faster browsing experience',
            'Mobile-first design with optimized touch interactions',
            'Added support for animated GIF event cover images',
          ],
        },
      ],
    },
  ];

  const getVersionBadgeColor = (type: string) => {
    if (type === 'major') {
      return 'bg-purple-100 text-purple-800';
    }
    switch (type) {
      case 'hotfix':
        return 'bg-red-100 text-red-800';
      case 'update':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <SheetWithDetentFull.Root
      presented={open}
      onPresentedChange={(presented) => onOpenChange(presented)}
      activeDetent={1}
      onActiveDetentChange={() => {}}
    >
      <SheetWithDetentFull.Portal>
        <SheetWithDetentFull.View>
          <SheetWithDetentFull.Backdrop />
          <SheetWithDetentFull.Content className="grid grid-rows-[min-content_1fr]">
            <div className="border-b border-gray-100 p-4">
              <div className="mb-4 flex justify-center">
                <SheetWithDetentFull.Handle />
              </div>
              <div>
                <h2 className="mb-2 text-2xl font-bold text-gray-900">
                  Change Log
                </h2>
                <p className="text-gray-600">
                  Stay updated with the latest app improvements
                </p>
              </div>
            </div>

            <SheetWithDetentFull.ScrollRoot asChild>
              <SheetWithDetentFull.ScrollView className="min-h-0">
                <SheetWithDetentFull.ScrollContent className="p-4">
                  <div className="space-y-6">
                    {changelogEntries.map((entry, index) => (
                      <div
                        key={entry.version}
                        className="overflow-hidden rounded-2xl bg-white shadow-sm"
                      >
                        {/* Version Header */}
                        <div className="border-b border-gray-100 p-4">
                          <div className="mb-2 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <h3 className="text-lg font-bold text-gray-900">
                                v{entry.version}
                              </h3>
                              <span
                                className={`rounded-full px-2 py-1 text-xs font-medium ${getVersionBadgeColor(
                                  entry.type
                                )}`}
                              >
                                {entry.type}
                              </span>
                            </div>
                            {index === 0 && (
                              <span className="rounded-full bg-red-100 px-2 py-1 text-xs font-medium text-red-800">
                                Latest
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 text-sm text-gray-500">
                            <Calendar className="h-4 w-4" />
                            <span>{entry.date}</span>
                          </div>
                        </div>

                        {/* Changes */}
                        <div className="space-y-4 p-4">
                          {entry.changes.map(
                            (changeCategory, categoryIndex) => (
                              <div key={categoryIndex}>
                                <div className="mb-3 flex items-center gap-2">
                                  {changeCategory.icon}
                                  <h4 className="font-semibold text-gray-900">
                                    {changeCategory.category}
                                  </h4>
                                </div>
                                <ul className="ml-6 space-y-2">
                                  {changeCategory.items.map(
                                    (item, itemIndex) => (
                                      <li
                                        key={itemIndex}
                                        className="flex items-start gap-2 text-sm text-gray-700"
                                      >
                                        <div className="mt-2 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-gray-400"></div>
                                        <span>{item}</span>
                                      </li>
                                    )
                                  )}
                                </ul>
                              </div>
                            )
                          )}
                        </div>
                      </div>
                    ))}

                    {/* Footer */}
                    <div className="py-6 text-center">
                      <p className="text-sm text-gray-500">
                        Want to suggest a feature or report a bug?{' '}
                        <button
                          onClick={() => onOpenChange(false)}
                          className="font-medium text-red-600 hover:underline"
                        >
                          Contact us
                        </button>
                      </p>
                    </div>
                  </div>
                </SheetWithDetentFull.ScrollContent>
              </SheetWithDetentFull.ScrollView>
            </SheetWithDetentFull.ScrollRoot>
          </SheetWithDetentFull.Content>
        </SheetWithDetentFull.View>
      </SheetWithDetentFull.Portal>
    </SheetWithDetentFull.Root>
  );
}
