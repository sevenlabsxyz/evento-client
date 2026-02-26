'use client';

import EnhancedBlogContent from '@/components/blog/enhanced-blog-content';
import { Button } from '@/components/ui/button';
import { MasterScrollableSheet } from '@/components/ui/master-scrollable-sheet';
import Image from 'next/image';

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
    <MasterScrollableSheet
      open={open}
      onOpenChange={onOpenChange}
      title={article.title}
      contentClassName='bg-white'
    >
      {/* Feature Image */}
      {article.feature_image && (
        <div className='mb-6 px-6'>
          <div className='relative aspect-video w-full overflow-hidden rounded-3xl border border-gray-200'>
            <Image
              src={article.feature_image}
              alt={article.title}
              fill
              className='object-cover'
              sizes='(max-width: 768px) 100vw, 800px'
            />
          </div>
        </div>
      )}

      {/* Article Content */}
      <div className='px-6 pb-24'>
        <div className='prose prose-lg mx-auto max-w-full prose-headings:break-words prose-headings:font-bold prose-headings:text-gray-900 prose-p:break-words prose-p:leading-relaxed prose-p:text-gray-700 prose-a:break-words prose-a:text-blue-600 prose-a:no-underline hover:prose-a:underline prose-strong:font-semibold prose-strong:text-gray-900 prose-code:break-words prose-code:rounded prose-code:bg-gray-100 prose-code:px-1.5 prose-code:py-0.5 prose-code:text-sm prose-code:text-gray-900 prose-ol:my-4 prose-ul:my-4 prose-li:text-gray-700 prose-img:max-w-full prose-img:rounded-2xl prose-img:border prose-img:border-gray-200'>
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
    </MasterScrollableSheet>
  );
}
