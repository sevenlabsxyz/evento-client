import { BlogPostClient } from '@/components/blog/blog-post-client';
import { render, screen } from '@testing-library/react';

const enhancedBlogContentMock = jest.fn(
  ({ html, className }: { html: string; className?: string }) => (
    <div
      data-testid='enhanced-blog-content'
      className={className}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  )
);

jest.mock('@/components/blog/enhanced-blog-content', () => ({
  __esModule: true,
  default: (props: { html: string; className?: string }) => enhancedBlogContentMock(props),
}));

jest.mock('@/components/blog/blog-card', () => ({
  BlogCard: ({ title }: { title: string }) => <div>{title}</div>,
}));

jest.mock('@/lib/hooks/use-ghost-posts', () => ({
  useGhostPosts: () => ({ data: [], isLoading: false }),
}));

jest.mock('@/lib/stores/topbar-store', () => ({
  useTopBar: () => ({ setTopBar: jest.fn() }),
}));

jest.mock('@/lib/utils/toast', () => ({
  toast: { success: jest.fn(), error: jest.fn() },
}));

jest.mock('next/image', () => ({
  __esModule: true,
  default: ({ alt, fill, priority, quality, sizes, ...props }: any) => <img alt={alt} {...props} />,
}));

describe('BlogPostClient article content', () => {
  it('uses the shadcn typeset wrapper and Evento article preset for post HTML only', () => {
    render(
      <BlogPostClient
        post={{
          id: 'post-1',
          uuid: 'post-uuid-1',
          slug: 'typeset-adoption',
          title: 'Typeset Adoption',
          html: '<p>Body copy</p>',
          excerpt: 'Excerpt',
          custom_excerpt: null,
          feature_image: 'https://evento.so/cover.jpg',
          feature_image_alt: null,
          featured: false,
          published_at: '2026-07-11T00:00:00.000Z',
          reading_time: 3,
          url: 'https://evento.so/blog/typeset-adoption',
          tags: [],
          authors: [],
          primary_author: null,
          primary_tag: null,
        }}
      />
    );

    expect(screen.getByRole('heading', { name: 'Typeset Adoption' })).not.toHaveClass('typeset');
    expect(screen.getByTestId('enhanced-blog-content')).toHaveClass(
      'typeset',
      'typeset-evento-article',
      'mt-9',
      'max-w-none',
      'lg:mt-14'
    );
    expect(enhancedBlogContentMock).toHaveBeenCalledWith(
      expect.objectContaining({ html: '<p>Body copy</p>' })
    );
  });
});
