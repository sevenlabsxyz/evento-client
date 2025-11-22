'use client';

import EnhancedBlogContent from '@/components/blog/enhanced-blog-content';
import { Button } from '@/components/ui/button';
import { SheetWithDetentFull } from '@/components/ui/sheet-with-detent-full';
import { VisuallyHidden } from '@silk-hq/components';
import { X } from 'lucide-react';
import Image from 'next/image';
import '../blog/blog-post.css';

interface BlogPost {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  feature_image: string;
  published_at: string;
  html: string;
  tags: Array<{
    id: string;
    name: string;
    slug: string;
  }>;
  authors: Array<{
    id: string;
    name: string;
    profile_image: string;
  }>;
}

interface WalletEducationalSheetProps {
  article: BlogPost | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function WalletEducationalSheet({
  article,
  open,
  onOpenChange,
}: WalletEducationalSheetProps) {
  if (!article) return null;

  return (
    <SheetWithDetentFull.Root presented={open} onPresentedChange={onOpenChange}>
      <SheetWithDetentFull.Portal>
        <SheetWithDetentFull.View>
          <SheetWithDetentFull.Backdrop />
          <SheetWithDetentFull.Content>
            {/* Handle OUTSIDE ScrollRoot */}
            <div className='my-4 flex items-center'>
              <SheetWithDetentFull.Handle className='mx-auto h-1 w-12 rounded-full bg-gray-300' />
            </div>

            {/* Accessibility title */}
            <VisuallyHidden.Root asChild>
              <SheetWithDetentFull.Title>{article.title}</SheetWithDetentFull.Title>
            </VisuallyHidden.Root>

            {/* Scrollable content */}
            <SheetWithDetentFull.ScrollRoot>
              <SheetWithDetentFull.ScrollView>
                <SheetWithDetentFull.ScrollContent>
                  {/* iOS-style header bar */}
                  <div className='flex items-start justify-between gap-3 bg-white px-4 py-3'>
                    <h2 className='flex-1 text-xl font-semibold text-gray-900'>{article.title}</h2>
                    <div className='flex flex-shrink-0 items-center gap-2'>
                      <button
                        onClick={() => onOpenChange(false)}
                        className='flex h-11 w-11 items-center justify-center rounded-full transition-colors hover:bg-gray-100'
                      >
                        <X className='h-5 w-5 text-gray-600' />
                      </button>
                    </div>
                  </div>

                  {/* Content - white background, full width */}
                  <div className='h-[95vh] overflow-y-auto bg-white pb-8 pt-2'>
                    {/* Feature Image */}
                    {article.feature_image && (
                      <div className='mb-6 px-6'>
                        <Image
                          src={article.feature_image}
                          alt={article.title}
                          width={800}
                          height={450}
                          className='h-auto w-full rounded-3xl border border-gray-200'
                        />
                      </div>
                    )}

                    {/* Article Content */}
                    <div className='px-6 pb-24'>
                      <div className='prose prose-xl max-w-none prose-headings:font-bold prose-headings:text-gray-900 prose-p:leading-relaxed prose-p:text-gray-700 prose-a:text-blue-600 prose-a:no-underline hover:prose-a:underline prose-strong:font-semibold prose-strong:text-gray-900 prose-code:rounded prose-code:bg-gray-100 prose-code:px-1.5 prose-code:py-0.5 prose-code:text-base prose-code:text-gray-900 prose-ol:my-4 prose-ul:my-4 prose-li:text-gray-700 prose-img:rounded-2xl prose-img:border prose-img:border-gray-200'>
                        <EnhancedBlogContent html={article.html} />
                      </div>

                      {/* Done Button */}
                      <div className='mt-8'>
                        <Button
                          onClick={() => onOpenChange(false)}
                          variant='outline'
                          className='font-lg h-12 w-full rounded-full bg-gray-50'
                        >
                          Done
                        </Button>
                      </div>
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
