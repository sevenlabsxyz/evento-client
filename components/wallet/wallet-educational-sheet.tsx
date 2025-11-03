'use client';

import EnhancedBlogContent from '@/components/blog/enhanced-blog-content';
import { Button } from '@/components/ui/button';
import { SheetWithDetentFull } from '@/components/ui/sheet-with-detent-full';
import { toast } from '@/lib/utils/toast';
import { VisuallyHidden } from '@silk-hq/components';
import { formatDistance, subDays } from 'date-fns';
import { Share2, X } from 'lucide-react';

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

  const handleShare = async () => {
    const shareData = {
      title: article.title,
      text: article.excerpt,
      url: `${window.location.origin}/blog/${article.slug}`,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (error) {
        // User cancelled or share failed
        console.log('Share cancelled or failed');
      }
    } else {
      // Fallback: copy to clipboard
      try {
        await navigator.clipboard.writeText(shareData.url);
        toast.success('Link copied to clipboard');
      } catch (error) {
        toast.error('Failed to copy link');
      }
    }
  };

  return (
    <SheetWithDetentFull.Root presented={open} onPresentedChange={onOpenChange}>
      <SheetWithDetentFull.Portal>
        <SheetWithDetentFull.View>
          <SheetWithDetentFull.Backdrop />
          <SheetWithDetentFull.Content>
            {/* Accessibility title */}
            <VisuallyHidden.Root asChild>
              <SheetWithDetentFull.Title>{article.title}</SheetWithDetentFull.Title>
            </VisuallyHidden.Root>

            {/* Sticky header with handle and buttons */}
            <div className='sticky top-0 z-10 border-b bg-white'>
              <div className='flex items-center justify-center py-4'>
                <SheetWithDetentFull.Handle className='h-1 w-12 rounded-full bg-gray-300' />
              </div>
              <div className='flex items-center justify-end gap-2 px-4 pb-4'>
                <Button onClick={handleShare} variant='ghost' size='sm' className='h-9 w-9 p-0'>
                  <Share2 className='h-5 w-5' />
                </Button>
                <Button
                  onClick={() => onOpenChange(false)}
                  variant='ghost'
                  size='sm'
                  className='h-9 w-9 p-0'
                >
                  <X className='h-5 w-5' />
                </Button>
              </div>
            </div>

            {/* Scrollable content */}
            <SheetWithDetentFull.ScrollRoot asChild>
              <SheetWithDetentFull.ScrollView>
                <SheetWithDetentFull.ScrollContent className='px-4 py-6'>
                  <div className='mx-auto max-w-2xl'>
                    {/* Feature Image */}
                    {article.feature_image && (
                      <div className='mb-6 overflow-hidden rounded-2xl'>
                        <img
                          src={article.feature_image}
                          alt={article.title}
                          className='h-auto w-full'
                        />
                      </div>
                    )}

                    {/* Title */}
                    <h1 className='mb-3 text-3xl font-bold text-gray-900'>{article.title}</h1>

                    {/* Meta */}
                    <div className='mb-6 flex items-center gap-3 text-sm text-gray-600'>
                      {article.authors && article.authors[0] && (
                        <>
                          {article.authors[0].profile_image && (
                            <img
                              src={article.authors[0].profile_image}
                              alt={article.authors[0].name}
                              className='h-8 w-8 rounded-full'
                            />
                          )}
                          <span className='font-medium'>{article.authors[0].name}</span>
                          <span>•</span>
                        </>
                      )}
                      <time>
                        {formatDistance(subDays(new Date(article.published_at), 0), new Date(), {
                          addSuffix: true,
                        })}
                      </time>
                    </div>

                    {/* Tags */}
                    {article.tags && article.tags.length > 0 && (
                      <div className='mb-6 flex flex-wrap gap-2'>
                        {article.tags.map((tag) => (
                          <span
                            key={tag.id}
                            className='rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-700'
                          >
                            {tag.name}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Article Content */}
                    <div className='prose prose-lg max-w-none'>
                      <EnhancedBlogContent html={article.html} />
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
