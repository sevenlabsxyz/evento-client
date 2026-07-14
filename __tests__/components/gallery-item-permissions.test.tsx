import { fireEvent, render, screen } from '@testing-library/react';

import GalleryItem from '@/components/event-detail/gallery-item';

const mockDelete = jest.fn();
const mockToggleLike = jest.fn();

jest.mock('next/image', () => ({
  __esModule: true,
  default: ({
    fill: _fill,
    ...props
  }: React.ImgHTMLAttributes<HTMLImageElement> & { fill?: boolean }) => <img {...props} />,
}));

jest.mock('@/components/ui/dropdown-menu', () => ({
  DropdownMenu: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  DropdownMenuTrigger: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  DropdownMenuContent: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  DropdownMenuItem: ({ children, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) => (
    <button type='button' {...props}>
      {children}
    </button>
  ),
}));

jest.mock('@/lib/hooks/use-delete-gallery-item', () => ({
  useDeleteGalleryItem: () => ({ mutate: mockDelete }),
}));

jest.mock('@/lib/hooks/use-gallery-item-likes', () => ({
  useGalleryItemLikes: () => ({
    likes: 0,
    hasLiked: false,
    toggleLike: mockToggleLike,
    isLoading: false,
  }),
}));

jest.mock('@/lib/utils/toast', () => ({
  toast: { success: jest.fn(), error: jest.fn() },
}));

const item = {
  id: 'photo-1',
  created_at: '2026-07-14T12:00:00.000Z',
  url: 'https://example.com/photo.jpg',
  user_details: {
    id: 'uploader-1',
    username: 'uploader',
    name: 'Uploader',
    bio: '',
    image: '',
    verification_status: 'unverified',
  },
  events: { id: 'event-1', title: 'Event' },
};

describe('GalleryItem permissions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(window, 'confirm').mockReturnValue(true);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('shows delete controls to the uploader', () => {
    render(<GalleryItem item={item as any} currentUserId='uploader-1' eventId='event-1' />);

    expect(screen.getByRole('button', { name: 'Photo actions' })).toBeInTheDocument();
  });

  it('shows working delete controls to an event host', () => {
    render(<GalleryItem item={item as any} currentUserId='host-1' eventId='event-1' isEventHost />);

    expect(screen.getByRole('button', { name: 'Photo actions' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Delete Photo' }));

    expect(mockDelete).toHaveBeenCalledWith(
      { galleryItemId: 'photo-1', eventId: 'event-1' },
      expect.objectContaining({ onSuccess: expect.any(Function), onError: expect.any(Function) })
    );
  });

  it('hides delete controls from a nonhost who is not the uploader', () => {
    render(<GalleryItem item={item as any} currentUserId='viewer-1' eventId='event-1' />);

    expect(screen.queryByRole('button', { name: 'Photo actions' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Delete Photo' })).not.toBeInTheDocument();
  });

  it('normalizes relative gallery image paths before rendering', () => {
    render(
      <GalleryItem
        item={{ ...item, url: '/eventos/gallery/photo.jpg' } as any}
        currentUserId='viewer-1'
        eventId='event-1'
      />
    );

    expect(screen.getByRole('img')).toHaveAttribute(
      'src',
      'https://api.evento.so/storage/v1/object/public/cdn/eventos/gallery/photo.jpg?width=500&quality=80'
    );
  });

  it.each([
    ['Enter', 'Enter'],
    ['Space', ' '],
  ])('opens the image with the %s key', (_label, key) => {
    const onImageClick = jest.fn();
    render(
      <GalleryItem
        item={item as any}
        currentUserId='viewer-1'
        eventId='event-1'
        onImageClick={onImageClick}
      />
    );

    const imageTile = screen.getByRole('img').closest('[role="button"]');
    expect(imageTile).not.toBeNull();
    fireEvent.keyDown(imageTile!, { key });

    expect(onImageClick).toHaveBeenCalledTimes(1);
  });

  it('keeps nested like and menu controls from activating the image tile', () => {
    const onImageClick = jest.fn();
    render(
      <GalleryItem
        item={item as any}
        currentUserId='uploader-1'
        eventId='event-1'
        onImageClick={onImageClick}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: '0' }));
    fireEvent.click(screen.getByRole('button', { name: 'Photo actions' }));

    expect(mockToggleLike).toHaveBeenCalledTimes(1);
    expect(onImageClick).not.toHaveBeenCalled();
  });
});
