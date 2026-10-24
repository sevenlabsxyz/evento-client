import EnhancedBlogContent from '@/components/blog/enhanced-blog-content';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

jest.mock('next/image', () => ({
  __esModule: true,
  default: ({ alt, blurDataURL, placeholder, quality, sizes, unoptimized, ...props }: any) => (
    <img alt={alt} {...props} />
  ),
}));

describe('EnhancedBlogContent', () => {
  it('applies the typeset article classes on the content wrapper', async () => {
    const { container } = render(
      <EnhancedBlogContent
        html='<p>Article copy</p>'
        className='typeset typeset-evento-article mt-9'
      />
    );

    await screen.findByText('Article copy');

    expect(container.firstElementChild).toHaveClass('max-w-full', 'overflow-hidden');
    expect(container.firstElementChild).toHaveClass('typeset', 'typeset-evento-article', 'mt-9');
  });

  it('preserves external link hardening while rendering article HTML', async () => {
    render(
      <EnhancedBlogContent
        html='<p>Read <a href="https://example.com" rel="author">more</a>.</p>'
        className='typeset typeset-evento-article'
      />
    );

    const link = await screen.findByRole('link', { name: 'more' });

    expect(link).toHaveAttribute('href', 'https://example.com');
    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveAttribute('rel', expect.stringContaining('author'));
    expect(link).toHaveAttribute('rel', expect.stringContaining('noopener'));
    expect(link).toHaveAttribute('rel', expect.stringContaining('noreferrer'));
  });

  it('keeps optimized image lightbox behavior for article images', async () => {
    const user = userEvent.setup();

    render(
      <EnhancedBlogContent
        html='<p>Intro</p><img src="https://evento.so/article.jpg" alt="Stage lights" width="1200" height="800" />'
        className='typeset typeset-evento-article'
      />
    );

    const openButton = await screen.findByRole('button', { name: /Open image: Stage lights/ });
    expect(openButton).toHaveClass('relative', 'my-2', 'block', 'w-full');

    await user.click(openButton);

    await waitFor(() => {
      expect(screen.getAllByAltText('Stage lights')).toHaveLength(2);
    });
  });

  it('assigns stable unique ids to h2/h3 headings and reports the outline', async () => {
    const onHeadingsChange = jest.fn();

    render(
      <EnhancedBlogContent
        html='<h2>Getting Started!</h2><p>Copy</p><h3>Set up <em>your</em> wallet</h3><h2>Getting started</h2><h4>Fine print</h4>'
        className='typeset typeset-evento-article'
        onHeadingsChange={onHeadingsChange}
      />
    );

    const headings = await screen.findAllByRole('heading');
    const [firstH2, h3, secondH2, h4] = headings;

    expect(firstH2).toHaveAttribute('id', 'getting-started');
    expect(h3).toHaveAttribute('id', 'set-up-your-wallet');
    expect(secondH2).toHaveAttribute('id', 'getting-started-2');
    expect(h4).not.toHaveAttribute('id');

    expect(onHeadingsChange).toHaveBeenLastCalledWith([
      { id: 'getting-started', text: 'Getting Started!', level: 2 },
      { id: 'set-up-your-wallet', text: 'Set up your wallet', level: 3 },
      { id: 'getting-started-2', text: 'Getting started', level: 2 },
    ]);
  });
});
