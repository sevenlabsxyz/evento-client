import { fireEvent, render, screen, waitFor } from '@testing-library/react';

import GalleryPage from '@/app/e/[id]/gallery/page';

const mockBack = jest.fn();
const mockDeleteGalleryItem = jest.fn();
let mockUser: { id: string } | null = { id: 'viewer-1' };
let mockHostsData: Array<{ user_details: { id: string } }> = [];

const mockGalleryData = [
  {
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
  },
];

jest.mock('next/navigation', () => ({
  useParams: () => ({ id: 'event-1' }),
  useRouter: () => ({ back: mockBack }),
}));

jest.mock('@/lib/hooks/use-auth', () => ({
  useAuth: () => ({ user: mockUser }),
}));

jest.mock('@/lib/hooks/use-event-details', () => ({
  useEventDetails: () => ({
    data: {
      id: 'event-1',
      title: 'Event',
      creator_user_id: 'creator-1',
    },
    isLoading: false,
  }),
}));

jest.mock('@/lib/hooks/use-event-gallery', () => ({
  useEventGallery: () => ({ data: mockGalleryData, isLoading: false }),
}));

jest.mock('@/lib/hooks/use-event-hosts', () => ({
  useEventHosts: () => ({ data: mockHostsData, isLoading: false }),
}));

jest.mock('@/lib/hooks/use-delete-gallery-item', () => ({
  useDeleteGalleryItem: () => ({ mutateAsync: mockDeleteGalleryItem }),
}));

jest.mock('@/components/event-detail/gallery-item', () => ({
  __esModule: true,
  default: ({
    item,
    isEventHost,
    onImageClick,
  }: {
    item: { id: string };
    isEventHost: boolean;
    onImageClick: () => void;
  }) => (
    <button
      type='button'
      data-testid={`gallery-item-${item.id}`}
      data-is-event-host={String(isEventHost)}
      onClick={onImageClick}
    >
      Open photo
    </button>
  ),
}));

jest.mock('@/components/lightbox-viewer', () => ({
  LightboxViewer: ({
    images,
    selectedImage,
    showDropdownMenu,
    handleDelete,
  }: {
    images: Array<{ id: string }>;
    selectedImage: number | null;
    showDropdownMenu: boolean;
    handleDelete: (photoId: string) => Promise<{ success: boolean }>;
  }) => (
    <div
      data-testid='gallery-lightbox'
      data-show-delete={String(showDropdownMenu)}
      data-selected-image={selectedImage === null ? 'none' : String(selectedImage)}
    >
      {selectedImage !== null && (
        <button type='button' onClick={() => void handleDelete(images[selectedImage].id)}>
          Delete selected photo
        </button>
      )}
    </div>
  ),
}));

jest.mock('@/components/ui/skeleton', () => ({
  Skeleton: () => <div>Loading</div>,
}));

jest.mock('@/lib/utils/logger', () => ({
  logger: { error: jest.fn(), debug: jest.fn(), info: jest.fn() },
}));

describe('GalleryPage host moderation', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUser = { id: 'viewer-1' };
    mockHostsData = [];
    mockDeleteGalleryItem.mockResolvedValue({ galleryItemId: 'photo-1', eventId: 'event-1' });
  });

  it('gives a cohost grid and lightbox deletion controls backed by the real mutation', async () => {
    mockUser = { id: 'host-1' };
    mockHostsData = [{ user_details: { id: 'host-1' } }];

    render(<GalleryPage />);

    expect(screen.getByTitle('Add Photos')).toBeInTheDocument();
    expect(screen.getByTestId('gallery-item-photo-1')).toHaveAttribute(
      'data-is-event-host',
      'true'
    );

    fireEvent.click(screen.getByTestId('gallery-item-photo-1'));
    expect(screen.getByTestId('gallery-lightbox')).toHaveAttribute('data-show-delete', 'true');

    fireEvent.click(screen.getByRole('button', { name: 'Delete selected photo' }));
    await waitFor(() => {
      expect(mockDeleteGalleryItem).toHaveBeenCalledWith({
        galleryItemId: 'photo-1',
        eventId: 'event-1',
      });
    });
  });

  it('lets the uploader delete from the lightbox without granting host controls', () => {
    mockUser = { id: 'uploader-1' };

    render(<GalleryPage />);
    fireEvent.click(screen.getByTestId('gallery-item-photo-1'));

    expect(screen.queryByTitle('Add Photos')).not.toBeInTheDocument();
    expect(screen.getByTestId('gallery-item-photo-1')).toHaveAttribute(
      'data-is-event-host',
      'false'
    );
    expect(screen.getByTestId('gallery-lightbox')).toHaveAttribute('data-show-delete', 'true');
  });

  it('shows no deletion controls to a nonhost who is not the uploader', () => {
    render(<GalleryPage />);
    fireEvent.click(screen.getByTestId('gallery-item-photo-1'));

    expect(screen.queryByTitle('Add Photos')).not.toBeInTheDocument();
    expect(screen.getByTestId('gallery-lightbox')).toHaveAttribute('data-show-delete', 'false');
  });
});
