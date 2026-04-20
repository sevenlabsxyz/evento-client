import { act, renderHook, waitFor } from '@testing-library/react';

import { useScreenWakeLock } from '@/lib/hooks/use-screen-wake-lock';

type ReleaseListener = () => void;

class MockWakeLockSentinel {
  listeners = new Set<ReleaseListener>();
  release = jest.fn(async () => {
    this.dispatchRelease();
  });

  addEventListener(_type: 'release', listener: ReleaseListener) {
    this.listeners.add(listener);
  }

  dispatchRelease() {
    this.listeners.forEach((listener) => listener());
  }
}

describe('useScreenWakeLock', () => {
  const originalWakeLock = (navigator as Navigator & { wakeLock?: unknown }).wakeLock;
  const originalVisibilityState = document.visibilityState;

  beforeEach(() => {
    jest.clearAllMocks();
    setVisibilityState('visible');
    deleteWakeLock();
  });

  afterAll(() => {
    if (originalWakeLock === undefined) {
      deleteWakeLock();
    } else {
      setWakeLock(originalWakeLock);
    }

    setVisibilityState(originalVisibilityState);
  });

  it('requests a screen wake lock when enabled', async () => {
    const sentinel = new MockWakeLockSentinel();
    const request = jest.fn().mockResolvedValue(sentinel);
    setWakeLock({ request });

    const { result } = renderHook(() => useScreenWakeLock({ enabled: true }));

    await waitFor(() => {
      expect(result.current.active).toBe(true);
    });

    expect(request).toHaveBeenCalledWith('screen');
    expect(result.current.supported).toBe(true);
    expect(result.current.errorReason).toBeNull();
  });

  it('reports unsupported browsers without requesting a wake lock', async () => {
    const { result } = renderHook(() => useScreenWakeLock({ enabled: true }));

    await waitFor(() => {
      expect(result.current.errorReason).toBe('unsupported');
    });

    expect(result.current.supported).toBe(false);
    expect(result.current.active).toBe(false);
  });

  it('reports request failures from the browser', async () => {
    const request = jest.fn().mockRejectedValue(new Error('Not allowed'));
    setWakeLock({ request });

    const { result } = renderHook(() => useScreenWakeLock({ enabled: true }));

    await waitFor(() => {
      expect(result.current.errorReason).toBe('request-failed');
    });

    expect(result.current.errorMessage).toBe('Not allowed');
    expect(result.current.active).toBe(false);
    expect(result.current.supported).toBe(true);
  });

  it('retries the wake lock request after a user interaction when the initial request fails', async () => {
    const sentinel = new MockWakeLockSentinel();
    const request = jest
      .fn()
      .mockRejectedValueOnce(new Error('Not allowed'))
      .mockResolvedValueOnce(sentinel);
    setWakeLock({ request });

    const { result } = renderHook(() => useScreenWakeLock({ enabled: true }));

    await waitFor(() => {
      expect(result.current.errorReason).toBe('request-failed');
    });

    act(() => {
      document.dispatchEvent(new MouseEvent('click'));
    });

    await waitFor(() => {
      expect(request).toHaveBeenCalledTimes(2);
    });

    await waitFor(() => {
      expect(result.current.active).toBe(true);
    });
  });

  it('retries after the page becomes visible and the user interacts again', async () => {
    const firstSentinel = new MockWakeLockSentinel();
    const secondSentinel = new MockWakeLockSentinel();
    const request = jest
      .fn()
      .mockResolvedValueOnce(firstSentinel)
      .mockRejectedValueOnce(new Error('Not allowed'))
      .mockResolvedValueOnce(secondSentinel);

    setWakeLock({ request });

    const { result } = renderHook(() => useScreenWakeLock({ enabled: true }));

    await waitFor(() => {
      expect(result.current.active).toBe(true);
    });

    act(() => {
      setVisibilityState('hidden');
      firstSentinel.dispatchRelease();
      document.dispatchEvent(new Event('visibilitychange'));
    });

    act(() => {
      setVisibilityState('visible');
      document.dispatchEvent(new Event('visibilitychange'));
    });

    await waitFor(() => {
      expect(result.current.errorReason).toBe('request-failed');
    });

    act(() => {
      document.dispatchEvent(new MouseEvent('click'));
    });

    await waitFor(() => {
      expect(request).toHaveBeenCalledTimes(3);
    });

    await waitFor(() => {
      expect(result.current.active).toBe(true);
    });
  });

  it('reacquires the wake lock when the page becomes visible again', async () => {
    const firstSentinel = new MockWakeLockSentinel();
    const secondSentinel = new MockWakeLockSentinel();
    const request = jest
      .fn()
      .mockResolvedValueOnce(firstSentinel)
      .mockResolvedValueOnce(secondSentinel);

    setWakeLock({ request });

    const { result } = renderHook(() => useScreenWakeLock({ enabled: true }));

    await waitFor(() => {
      expect(result.current.active).toBe(true);
    });

    act(() => {
      setVisibilityState('hidden');
      firstSentinel.dispatchRelease();
      document.dispatchEvent(new Event('visibilitychange'));
    });

    expect(request).toHaveBeenCalledTimes(1);

    act(() => {
      setVisibilityState('visible');
      document.dispatchEvent(new Event('visibilitychange'));
    });

    await waitFor(() => {
      expect(request).toHaveBeenCalledTimes(2);
    });

    await waitFor(() => {
      expect(result.current.active).toBe(true);
    });
  });

  it('releases the wake lock on unmount', async () => {
    const sentinel = new MockWakeLockSentinel();
    const request = jest.fn().mockResolvedValue(sentinel);
    setWakeLock({ request });

    const { unmount } = renderHook(() => useScreenWakeLock({ enabled: true }));

    await waitFor(() => {
      expect(request).toHaveBeenCalledTimes(1);
    });

    unmount();

    await waitFor(() => {
      expect(sentinel.release).toHaveBeenCalledTimes(1);
    });
  });
});

function setWakeLock(wakeLock: unknown) {
  Object.defineProperty(navigator, 'wakeLock', {
    configurable: true,
    value: wakeLock,
    writable: true,
  });
}

function deleteWakeLock() {
  Object.defineProperty(navigator, 'wakeLock', {
    configurable: true,
    value: undefined,
    writable: true,
  });
}

function setVisibilityState(value: DocumentVisibilityState) {
  Object.defineProperty(document, 'visibilityState', {
    configurable: true,
    value,
  });
}
