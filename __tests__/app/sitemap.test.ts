import sitemap from '@/app/sitemap';

describe('app sitemap', () => {
  it('returns valid sitemap entries for the public static routes', () => {
    const result = sitemap();

    expect(result).toHaveLength(3);
    expect(result).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          url: 'https://app.evento.so',
          changeFrequency: 'daily',
          priority: 1,
        }),
        expect.objectContaining({
          url: 'https://app.evento.so/privacy',
          changeFrequency: 'monthly',
          priority: 0.3,
        }),
        expect.objectContaining({
          url: 'https://app.evento.so/terms',
          changeFrequency: 'monthly',
          priority: 0.3,
        }),
      ])
    );

    for (const entry of result) {
      expect(entry.lastModified).toBeInstanceOf(Date);
    }
  });
});
