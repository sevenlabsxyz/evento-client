describe('chat logger gating', () => {
  const originalEnv = process.env;
  const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => undefined);

  beforeEach(() => {
    jest.resetModules();
    warnSpy.mockClear();
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
    warnSpy.mockRestore();
  });

  it('suppresses chat warn logs in production unless chat debug is enabled', async () => {
    process.env = { ...process.env, NODE_ENV: 'production' };
    delete process.env.NEXT_PUBLIC_CHAT_DEBUG;

    const { logger } = await import('@/lib/utils/logger');
    logger.warn('Chat runtime: start requested', { pubkey: 'abc' });

    expect(warnSpy).not.toHaveBeenCalled();
  });

  it('keeps non-chat warnings visible in production', async () => {
    process.env = { ...process.env, NODE_ENV: 'production' };
    delete process.env.NEXT_PUBLIC_CHAT_DEBUG;

    const { logger } = await import('@/lib/utils/logger');
    logger.warn('Weather service error', { city: 'Lisbon' });

    expect(warnSpy).toHaveBeenCalledWith('Weather service error', { city: 'Lisbon' });
  });

  it('emits chat warn logs when chat debug is explicitly enabled', async () => {
    process.env = { ...process.env, NODE_ENV: 'production', NEXT_PUBLIC_CHAT_DEBUG: 'true' };

    const { logger } = await import('@/lib/utils/logger');
    logger.warn('Chat API: fetching user by id', { userId: 'user_1' });

    expect(warnSpy).toHaveBeenCalledWith('Chat API: fetching user by id', { userId: 'user_1' });
  });
});
