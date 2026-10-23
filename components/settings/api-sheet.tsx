'use client';

import { Button } from '@/components/ui/button';
import { SheetWithDetentFull } from '@/components/ui/sheet-with-detent-full';

interface APISheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onContactRequest: () => void;
}

export function APISheet({ open, onOpenChange, onContactRequest }: APISheetProps) {
  const handleGetAccess = () => {
    onOpenChange(false);
    onContactRequest();
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
          <SheetWithDetentFull.Content className='grid grid-rows-[min-content_1fr]'>
            <div className='border-b border-gray-100 p-4 dark:border-neutral-800'>
              <div className='mb-4 flex justify-center'>
                <SheetWithDetentFull.Handle />
              </div>
              <div>
                <h2 className='mb-2 text-2xl font-bold text-gray-900 dark:text-neutral-100'>
                  Evento API22222
                </h2>
                <p className='text-gray-600 dark:text-neutral-400'>
                  Build custom integrations with Evento
                </p>
              </div>
            </div>

            <SheetWithDetentFull.ScrollRoot asChild>
              <SheetWithDetentFull.ScrollView className='min-h-0'>
                <SheetWithDetentFull.ScrollContent className='p-4'>
                  <div className='space-y-6'>
                    {/* CTA Button */}
                    <div className='rounded-2xl bg-white p-6 dark:bg-neutral-800'>
                      <Button
                        onClick={handleGetAccess}
                        className='w-full rounded-xl bg-red-500 py-4 text-lg font-semibold text-white hover:bg-red-600 dark:bg-red-600 dark:hover:bg-red-700'
                      >
                        Get API Access
                      </Button>
                    </div>

                    {/* Description */}
                    <div className='space-y-4 rounded-2xl bg-white p-6 dark:bg-neutral-800'>
                      <h2 className='text-xl font-bold text-gray-900 dark:text-neutral-100'>
                        Build Your Own Integrations
                      </h2>

                      <p className='leading-relaxed text-gray-700 dark:text-neutral-300'>
                        With the Evento API, you can build your own native integrations that allow
                        you to fully customize the UI while still providing your users, customers,
                        friends, or community access to your latest events and all the information
                        around them.
                      </p>

                      <div className='space-y-3'>
                        <h3 className='font-semibold text-gray-900 dark:text-neutral-100'>
                          What you can do:
                        </h3>
                        <ul className='space-y-2 text-gray-700 dark:text-neutral-300'>
                          <li className='flex items-start gap-2'>
                            <div className='mt-2 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-red-500 dark:bg-red-600'></div>
                            <span>Access event data and details</span>
                          </li>
                          <li className='flex items-start gap-2'>
                            <div className='mt-2 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-red-500 dark:bg-red-600'></div>
                            <span>Create custom event displays</span>
                          </li>
                          <li className='flex items-start gap-2'>
                            <div className='mt-2 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-red-500 dark:bg-red-600'></div>
                            <span>Integrate with your existing systems</span>
                          </li>
                          <li className='flex items-start gap-2'>
                            <div className='mt-2 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-red-500 dark:bg-red-600'></div>
                            <span>Build custom notification systems</span>
                          </li>
                          <li className='flex items-start gap-2'>
                            <div className='mt-2 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-red-500 dark:bg-red-600'></div>
                            <span>Sync events across platforms</span>
                          </li>
                        </ul>
                      </div>
                    </div>

                    {/* Use Cases */}
                    <div className='space-y-4 rounded-2xl bg-white p-6 dark:bg-neutral-800'>
                      <h3 className='font-semibold text-gray-900 dark:text-neutral-100'>
                        Popular Use Cases
                      </h3>

                      <div className='space-y-4'>
                        <div className='border-l-4 border-blue-500 pl-4'>
                          <h4 className='font-medium text-gray-900 dark:text-neutral-100'>
                            Website Integration
                          </h4>
                          <p className='text-sm text-gray-600 dark:text-neutral-400'>
                            Display your events on your website with custom styling
                          </p>
                        </div>

                        <div className='border-l-4 border-green-500 pl-4'>
                          <h4 className='font-medium text-gray-900 dark:text-neutral-100'>
                            Mobile Apps
                          </h4>
                          <p className='text-sm text-gray-600 dark:text-neutral-400'>
                            Build native mobile experiences for your events
                          </p>
                        </div>

                        <div className='border-l-4 border-purple-500 pl-4'>
                          <h4 className='font-medium text-gray-900 dark:text-neutral-100'>
                            Community Platforms
                          </h4>
                          <p className='text-sm text-gray-600 dark:text-neutral-400'>
                            Integrate events into Discord, Slack, or other platforms
                          </p>
                        </div>

                        <div className='border-l-4 border-red-500 pl-4'>
                          <h4 className='font-medium text-gray-900 dark:text-neutral-100'>
                            Analytics & Reporting
                          </h4>
                          <p className='text-sm text-gray-600 dark:text-neutral-400'>
                            Build custom dashboards and reporting tools
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Getting Started */}
                    <div className='space-y-4 rounded-2xl bg-white p-6 dark:bg-neutral-800'>
                      <h3 className='font-semibold text-gray-900 dark:text-neutral-100'>
                        Getting Started
                      </h3>

                      <div className='space-y-3'>
                        <div className='flex items-start gap-3'>
                          <div className='mt-0.5 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-red-100 dark:bg-red-950/60'>
                            <span className='text-xs font-bold text-red-600 dark:text-red-400'>
                              1
                            </span>
                          </div>
                          <div>
                            <p className='font-medium text-gray-900 dark:text-neutral-100'>
                              Request Access
                            </p>
                            <p className='text-sm text-gray-600 dark:text-neutral-400'>
                              Tell us about your use case and get approved
                            </p>
                          </div>
                        </div>

                        <div className='flex items-start gap-3'>
                          <div className='mt-0.5 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-red-100 dark:bg-red-950/60'>
                            <span className='text-xs font-bold text-red-600 dark:text-red-400'>
                              2
                            </span>
                          </div>
                          <div>
                            <p className='font-medium text-gray-900 dark:text-neutral-100'>
                              Get Your API Keys
                            </p>
                            <p className='text-sm text-gray-600 dark:text-neutral-400'>
                              Receive your authentication credentials
                            </p>
                          </div>
                        </div>

                        <div className='flex items-start gap-3'>
                          <div className='mt-0.5 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-red-100 dark:bg-red-950/60'>
                            <span className='text-xs font-bold text-red-600 dark:text-red-400'>
                              3
                            </span>
                          </div>
                          <div>
                            <p className='font-medium text-gray-900 dark:text-neutral-100'>
                              Start Building
                            </p>
                            <p className='text-sm text-gray-600 dark:text-neutral-400'>
                              Use our documentation to integrate the API
                            </p>
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
                        className='w-full bg-white font-semibold text-red-600 hover:bg-gray-100 dark:bg-neutral-900 dark:text-red-400 dark:hover:bg-neutral-800'
                      >
                        Request API Access
                      </Button>
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
