import { getOptimizedImageUrl, getOptimizedImageUrlPreservingGif } from '@/lib/utils/image';

describe('getOptimizedImageUrlPreservingGif', () => {
  it('serves a stored GIF from the CDN without transformation params', () => {
    expect(getOptimizedImageUrlPreservingGif('/eventos/gallery/anim.gif')).toBe(
      'https://api.evento.so/storage/v1/object/public/cdn/eventos/gallery/anim.gif'
    );
  });

  it('preserves animation for a relative GIF without a leading slash', () => {
    expect(getOptimizedImageUrlPreservingGif('eventos/gallery/anim.gif')).toBe(
      'https://api.evento.so/storage/v1/object/public/cdn/eventos/gallery/anim.gif'
    );
  });

  it('passes an external HTTPS GIF through unchanged', () => {
    const giphy = 'https://media.giphy.com/media/3oz8xLdCFAbGnVWG4E/giphy.gif';
    expect(getOptimizedImageUrlPreservingGif(giphy)).toBe(giphy);
  });

  it('applies transformation params to a stored non-GIF', () => {
    expect(getOptimizedImageUrlPreservingGif('/eventos/gallery/photo.jpg', 1200, 90)).toBe(
      'https://api.evento.so/storage/v1/object/public/cdn/eventos/gallery/photo.jpg?width=1200&quality=90'
    );
  });

  it('matches getOptimizedImageUrl for a relative non-GIF at default size/quality', () => {
    expect(getOptimizedImageUrlPreservingGif('/eventos/gallery/photo.jpg')).toBe(
      getOptimizedImageUrl('/eventos/gallery/photo.jpg')
    );
  });

  it('passes an external HTTPS non-GIF through unchanged', () => {
    const external = 'https://cdn.example.com/photo.jpg';
    expect(getOptimizedImageUrlPreservingGif(external, 1200, 90)).toBe(external);
  });
});
