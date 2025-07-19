'use client';

import { Button } from '@/components/ui/button';
import { SheetWithDetentFull } from '@/components/ui/sheet-with-detent-full';
import { Bot, Mail, Twitter } from 'lucide-react';

interface HelpSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function HelpSheet({ open, onOpenChange }: HelpSheetProps) {
  const handleExternalLink = (url: string) => {
    window.open(url, '_blank', 'noopener,noreferrer');
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
            <div className='border-b border-gray-100 p-4'>
              <div className='mb-4 flex justify-center'>
                <SheetWithDetentFull.Handle />
              </div>
              <div>
                <h2 className='mb-2 text-2xl font-bold text-gray-900'>Need Help?</h2>
                <p className='text-gray-600'>Choose how you'd like to get support</p>
              </div>
            </div>

            <SheetWithDetentFull.ScrollRoot asChild>
              <SheetWithDetentFull.ScrollView className='min-h-0'>
                <SheetWithDetentFull.ScrollContent className='p-4'>
                  <div className='space-y-4'>
                    {/* AI Agent Card */}
                    <div className='rounded-2xl border border-gray-200 bg-white p-6 transition-shadow hover:shadow-md'>
                      <div className='mb-4 flex items-center gap-4'>
                        <div className='flex h-12 w-12 items-center justify-center rounded-full bg-blue-100'>
                          <Bot className='h-6 w-6 text-blue-600' />
                        </div>
                        <div>
                          <h3 className='text-lg font-bold'>Talk to our AI agent</h3>
                          <p className='text-sm text-gray-500'>
                            Get instant answers to common questions
                          </p>
                        </div>
                      </div>
                      <Button className='w-full bg-blue-500 text-white hover:bg-blue-600'>
                        Start Chat
                      </Button>
                    </div>

                    {/* Twitter Card */}
                    <div className='rounded-2xl border border-gray-200 bg-white p-6 transition-shadow hover:shadow-md'>
                      <div className='mb-4 flex items-center gap-4'>
                        <div className='flex h-12 w-12 items-center justify-center rounded-full bg-black'>
                          <Twitter className='h-6 w-6 text-white' />
                        </div>
                        <div>
                          <h3 className='text-lg font-bold'>Reach out to us on X</h3>
                          <p className='text-sm text-gray-500'>Connect with us on social media</p>
                        </div>
                      </div>
                      <Button
                        className='w-full bg-black text-white hover:bg-gray-800'
                        onClick={() => handleExternalLink('https://x.com/evento')}
                      >
                        Follow @evento
                      </Button>
                    </div>

                    {/* Email Card */}
                    <div className='rounded-2xl border border-gray-200 bg-white p-6 transition-shadow hover:shadow-md'>
                      <div className='mb-4 flex items-center gap-4'>
                        <div className='flex h-12 w-12 items-center justify-center rounded-full bg-red-100'>
                          <Mail className='h-6 w-6 text-red-600' />
                        </div>
                        <div>
                          <h3 className='text-lg font-bold'>Email us at evento.so</h3>
                          <p className='text-sm text-gray-500'>Send us a detailed message</p>
                        </div>
                      </div>
                      <Button
                        className='w-full bg-red-500 text-white hover:bg-red-600'
                        onClick={() => handleExternalLink('mailto:hello@evento.so')}
                      >
                        Send Email
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
