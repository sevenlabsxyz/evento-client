import { BlogPostClient } from '@/components/blog/blog-post-client';
import type { BlogContentHeading } from '@/components/blog/enhanced-blog-content';
import { GhostPost, GhostTag } from '@/lib/types/ghost';
import { render, screen, within } from '@testing-library/react';
import { useEffect } from 'react';

interface EnhancedBlogContentMockProps {
  html: string;
  className?: string;
  onHeadingsChange?: (headings: BlogContentHeading[]) => void;
}

const mockHeadings: { current: BlogContentHeading[] } = { current: [] };

const mockEnhancedBlogContent = jest.fn(
  ({ html, className, onHeadingsChange }: EnhancedBlogContentMockProps) => {
    useEffect(() => {
      onHeadingsChange?.(mockHeadings.current);
    }, [html, onHeadingsChange]);

    return (
      <div
        data-testid='enhanced-blog-content'
        className={className}
        dangerouslySetInnerHTML={{ __html: html }}
      />
    );
  }
);

jest.mock('@/components/blog/enhanced-blog-content', () => ({
  __esModule: true,
  default: (props: EnhancedBlogContentMockProps) => mockEnhancedBlogContent(props),
}));

jest.mock('@/components/blog/blog-post-card', () => ({
  BlogPostCard: ({ post }: { post: { title: string } }) => (
    <div data-testid='related-post'>{post.title}</div>
  ),
}));

const mockRelatedPosts: { current: GhostPost[] } = { current: [] };
const mockUseGhostPosts = jest.fn();

jest.mock('@/lib/hooks/use-ghost-posts', () => ({
  useGhostPosts: (options: unknown) => {
    mockUseGhostPosts(options);
    return { data: mockRelatedPosts.current, isLoading: false };
  },
}));

const mockSetTopBar = jest.fn();

jest.mock('@/lib/stores/topbar-store', () => ({
  useTopBar: () => ({ setTopBar: mockSetTopBar }),
}));

jest.mock('@/lib/utils/toast', () => ({
  toast: { success: jest.fn(), error: jest.fn() },
}));

jest.mock('next/image', () => ({
  __esModule: true,
  default: ({
    alt,
    fill,
    priority,
    quality,
    sizes,
    ...props
  }: {
    alt: string;
    fill?: boolean;
    priority?: boolean;
    quality?: number;
    sizes?: string;
    src: string;
    className?: string;
  }) => <img alt={alt} {...props} />,
}));

function makeTag(slug: string, name = slug): GhostTag {
  return { id: `tag-${slug}`, name, slug, description: null, url: `https://evento.so/tag/${slug}` };
}

function makePost(overrides: Partial<GhostPost> = {}): GhostPost {
  return {
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
    ...overrides,
  };
}

describe('BlogPostClient', () => {
  beforeEach(() => {
    mockHeadings.current = [];
    mockRelatedPosts.current = [];
    mockEnhancedBlogContent.mockClear();
    mockSetTopBar.mockClear();
    mockUseGhostPosts.mockClear();
  });

  it('uses the shadcn typeset wrapper and Evento article preset for post HTML only', () => {
    render(<BlogPostClient post={makePost()} />);

    expect(screen.getByRole('heading', { level: 1, name: 'Typeset Adoption' })).not.toHaveClass(
      'typeset'
    );
    expect(screen.getByTestId('enhanced-blog-content')).toHaveClass(
      'typeset',
      'typeset-evento-article'
    );
    expect(mockEnhancedBlogContent).toHaveBeenCalledWith(
      expect.objectContaining({ html: '<p>Body copy</p>' })
    );
  });

  it('hides the top bar on desktop and renders an in-page breadcrumb instead', () => {
    const tag = makeTag('product', 'Product');
    render(<BlogPostClient post={makePost({ tags: [makeTag('blog'), tag], primary_tag: tag })} />);

    expect(mockSetTopBar).toHaveBeenCalledWith(
      expect.objectContaining({ leftMode: 'back', title: 'Blog', desktopHidden: true })
    );

    const breadcrumb = screen.getByRole('navigation', { name: 'Breadcrumb' });
    expect(within(breadcrumb).getByRole('link', { name: 'Blog' })).toHaveAttribute(
      'href',
      '/e/blog'
    );
    expect(within(breadcrumb).getByRole('link', { name: 'Product' })).toHaveAttribute(
      'href',
      '/e/blog?tag=product'
    );
  });

  it('skips the dek when the excerpt just repeats the opening paragraph', () => {
    render(
      <BlogPostClient
        post={makePost({
          html: '<p>Evento now ships a brand-new hub.</p><p>More copy.</p>',
          excerpt: 'Evento now ships a brand-new hub. More copy.',
        })}
      />
    );

    expect(
      screen.queryByText('Evento now ships a brand-new hub. More copy.')
    ).not.toBeInTheDocument();
  });

  it('shows a custom excerpt as the dek', () => {
    render(
      <BlogPostClient
        post={makePost({ custom_excerpt: 'A short summary written by the editor.' })}
      />
    );

    expect(screen.getByText('A short summary written by the editor.')).toBeInTheDocument();
  });

  it('builds the on-this-page outline from the content headings', async () => {
    mockHeadings.current = [
      { id: 'getting-started', text: 'Getting started', level: 2 },
      { id: 'next-steps', text: 'Next steps', level: 3 },
    ];

    render(<BlogPostClient post={makePost()} />);

    const toc = await screen.findByRole('navigation', { name: 'On this page' });
    expect(within(toc).getByRole('link', { name: 'Getting started' })).toHaveAttribute(
      'href',
      '#getting-started'
    );
    expect(within(toc).getByRole('link', { name: 'Next steps' })).toHaveAttribute(
      'href',
      '#next-steps'
    );
  });

  it('omits the outline when the article has fewer than two headings', () => {
    mockHeadings.current = [{ id: 'only', text: 'Only heading', level: 2 }];

    render(<BlogPostClient post={makePost()} />);

    expect(screen.queryByRole('navigation', { name: 'On this page' })).not.toBeInTheDocument();
  });

  it('links visible tags and prefers related posts that share one', () => {
    const product = makeTag('product', 'Product');
    mockRelatedPosts.current = [
      makePost({ id: 'current', slug: 'typeset-adoption', title: 'Current post' }),
      makePost({ id: 'newest', slug: 'newest', title: 'Newest post', tags: [makeTag('blog')] }),
      makePost({ id: 'sibling', slug: 'sibling', title: 'Sibling post', tags: [product] }),
      makePost({ id: 'older', slug: 'older', title: 'Older post' }),
      makePost({ id: 'oldest', slug: 'oldest', title: 'Oldest post' }),
    ];

    render(
      <BlogPostClient
        post={makePost({ tags: [makeTag('blog'), makeTag('hash-internal', '#internal'), product] })}
      />
    );

    expect(mockUseGhostPosts).toHaveBeenCalledWith({ limit: 7, filter: 'tag:blog' });

    const tagList = screen.getByRole('list', { name: 'Tags' });
    const tagLinks = within(tagList).getAllByRole('link');
    expect(tagLinks).toHaveLength(1);
    expect(tagLinks[0]).toHaveTextContent('Product');
    expect(tagLinks[0]).toHaveAttribute('href', '/e/blog?tag=product');

    expect(screen.getByRole('heading', { name: 'Keep reading' })).toBeInTheDocument();
    expect(screen.getAllByTestId('related-post').map((card) => card.textContent)).toEqual([
      'Sibling post',
      'Newest post',
      'Older post',
    ]);
  });
});
