'use client';

import EnhancedBlogContent from '@/components/blog/enhanced-blog-content';
import { SheetWithDetentFull } from '@/components/ui/sheet-with-detent-full';
import { VisuallyHidden } from '@silk-hq/components';
import { X } from 'lucide-react';
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
                  <div className='flex items-start justify-between gap-3 border-b border-gray-200 bg-white px-4 py-3'>
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
                  <div className='h-[95vh] overflow-y-auto bg-white py-6 pb-8'>
                    {/* Feature Image */}
                    {article.feature_image && (
                      <div className='mb-6 px-6'>
                        <img
                          src={article.feature_image}
                          alt={article.title}
                          className='h-auto w-full rounded-3xl'
                        />
                      </div>
                    )}

                    {/* Article Content */}
                    <div className='px-6 pb-24'>
                      <div className='prose prose-xl max-w-none'>
                        <EnhancedBlogContent html={article.html} />
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
