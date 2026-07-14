import { fireEvent, render, screen } from '@testing-library/react';

import EventGallery from '@/components/event-detail/event-gallery';

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
      {item.id}
    </button>
  ),
}));

jest.mock('@/components/event-detail/photo-upload-sheet', () => ({
  __esModule: true,
  default: () => null,
}));

const galleryItem = {
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

describe('EventGallery', () => {
  it('preserves full gallery item identity and host permission on the rendered grid', () => {
    const onImageClick = jest.fn();

    render(
      <EventGallery
        event={{ id: 'event-1', title: 'Event' } as any}
        galleryItems={[galleryItem as any]}
        currentUserId='host-1'
        isEventHost
        onImageClick={onImageClick}
      />
    );

    const renderedItem = screen.getByTestId('gallery-item-photo-1');
    expect(renderedItem).toHaveAttribute('data-is-event-host', 'true');

    fireEvent.click(renderedItem);
    expect(onImageClick).toHaveBeenCalledWith(0);
  });
});
