import { useDeleteGalleryItem } from '@/lib/hooks/use-delete-gallery-item';
import { useGenerateDescription } from '@/lib/hooks/use-generate-description';
import { useMultiFileUpload } from '@/lib/hooks/use-multi-file-upload';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook } from '@testing-library/react';

jest.mock('@/lib/utils/logger', () => ({
  logger: {
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    logApiRequest: jest.fn(),
    logApiResponse: jest.fn(),
  },
}));

jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
    refresh: jest.fn(),
    pathname: '/',
    query: {},
    asPath: '/',
    events: {
      on: jest.fn(),
      off: jest.fn(),
      emit: jest.fn(),
    },
    isFallback: false,
    isLocaleDomain: false,
    isReady: true,
    isPreview: false,
    basePath: '',
    locale: 'en',
    locales: ['en'],
    defaultLocale: 'en',
    domainLocales: [],
    isSsr: false,
  }),
  usePathname: () => '/',
  useSearchParams: () => new URLSearchParams(),
  useParams: () => ({}),
}));

describe('Content Management Integration Flow', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  const createWrapper = (client: QueryClient) => {
    return ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={client}>{children}</QueryClientProvider>
    );
  };

  it('should handle multi-file upload flow', async () => {
    const mockUploadResponse = {
      success: true,
      message: 'Files uploaded successfully',
      data: [
        {
          id: 'file1',
          url: 'https://example.com/file1.jpg',
          filename: 'file1.jpg',
          size: 1024000,
        },
        {
          id: 'file2',
          url: 'https://example.com/file2.jpg',
          filename: 'file2.jpg',
          size: 2048000,
        },
      ],
    };

    const mockOnUpload = jest.fn().mockResolvedValue({
      success: true,
      data: mockUploadResponse,
    });
    const mockOnSuccess = jest.fn();

    const { result } = renderHook(
      () =>
        useMultiFileUpload({
          onUpload: mockOnUpload,
          onSuccess: mockOnSuccess,
          maxFiles: 5,
          maxFileSize: 10,
        }),
      {
        wrapper: createWrapper(queryClient),
      }
    );

    const mockFile1 = new File(['file1 content'], 'file1.jpg', {
      type: 'image/jpeg',
    });
    const mockFile2 = new File(['file2 content'], 'file2.jpg', {
      type: 'image/jpeg',
    });
    const mockFiles = [mockFile1, mockFile2];

    await act(async () => {
      result.current.handleFileSelect({
        target: { files: mockFiles },
      } as any);
    });

    expect(result.current.selectedFilesData).toHaveLength(2);
    expect(result.current.isUploading).toBe(false);

    await act(async () => {
      result.current.uploadFiles();
    });

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 200));
    });

    expect(mockOnUpload).toHaveBeenCalledTimes(2);
    expect(mockOnSuccess).toHaveBeenCalled();
    expect(result.current.isUploading).toBe(false);
  });

  it('should handle file validation errors', async () => {
    const { result } = renderHook(
      () =>
        useMultiFileUpload({
          onUpload: jest.fn(),
          onSuccess: jest.fn(),
          maxFiles: 2,
          maxFileSize: 1,
        }),
      {
        wrapper: createWrapper(queryClient),
      }
    );

    const largeFile = new File(['x'.repeat(2 * 1024 * 1024)], 'large.jpg', {
      type: 'image/jpeg',
    });
    const mockFiles = [largeFile];

    await act(async () => {
      result.current.handleFileSelect({
        target: { files: mockFiles },
      } as any);
    });

    expect(result.current.selectedFilesData).toHaveLength(0);
  });

  it('should handle upload errors', async () => {
    const mockOnUpload = jest.fn().mockRejectedValue(new Error('Upload failed'));
    const mockOnSuccess = jest.fn();

    const { result } = renderHook(
      () =>
        useMultiFileUpload({
          onUpload: mockOnUpload,
          onSuccess: mockOnSuccess,
        }),
      {
        wrapper: createWrapper(queryClient),
      }
    );

    const mockFile = new File(['file content'], 'file.jpg', {
      type: 'image/jpeg',
    });
    const mockFiles = [mockFile];

    await act(async () => {
      result.current.handleFileSelect({
        target: { files: mockFiles },
      } as any);
    });

    await act(async () => {
      result.current.uploadFiles();
    });

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 200));
    });

    expect(mockOnUpload).toHaveBeenCalled();
    expect(result.current.isUploading).toBe(false);
    expect(result.current.uploadProgressIndividual.some((p) => p.status === 'failed')).toBe(true);
  });

  it('should handle AI description generation', async () => {
    const { result } = renderHook(() => useGenerateDescription(), {
      wrapper: createWrapper(queryClient),
    });

    const generateData = {
      title: 'Summer Party',
      location: 'Beach House',
      startDate: '2025-07-15',
      currentDescription: 'A fun summer party',
      length: 'medium' as const,
      tone: 'casual' as const,
    };

    await act(async () => {
      result.current.mutate(generateData);
    });

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 200));
    });

    expect(result.current.data).toBeDefined();
    expect(result.current.isPending).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('should handle description generation errors', async () => {
    const apiClient = require('@/lib/api/client').default;
    apiClient.post.mockRejectedValueOnce(new Error('AI service unavailable'));

    const { result } = renderHook(() => useGenerateDescription(), {
      wrapper: createWrapper(queryClient),
    });

    const generateData = {
      title: 'Summer Party',
      location: 'Beach House',
      startDate: '2025-07-15',
      currentDescription: 'A fun summer party',
      length: 'medium' as const,
      tone: 'casual' as const,
    };

    await act(async () => {
      result.current.mutate(generateData);
    });

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 200));
    });

    expect(result.current.isPending).toBe(false);
    expect(result.current.error).toBeTruthy();
  });

  it('should handle gallery item deletion', async () => {
    const { result } = renderHook(() => useDeleteGalleryItem(), {
      wrapper: createWrapper(queryClient),
    });

    await act(async () => {
      result.current.mutate({ galleryItemId: 'gallery1', eventId: 'event123' });
    });

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 200));
    });

    expect(result.current.isPending).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('should handle gallery deletion errors', async () => {
    const apiClient = require('@/lib/api/client').default;
    apiClient.delete.mockRejectedValueOnce(new Error('Delete failed'));

    const { result } = renderHook(() => useDeleteGalleryItem(), {
      wrapper: createWrapper(queryClient),
    });

    await act(async () => {
      result.current.mutate({ galleryItemId: 'gallery1', eventId: 'event123' });
    });

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 200));
    });

    expect(result.current.isPending).toBe(false);
    expect(result.current.error).toBeTruthy();
  });

  it('should handle file type validation', async () => {
    const { result } = renderHook(
      () =>
        useMultiFileUpload({
          onUpload: jest.fn(),
          onSuccess: jest.fn(),
          acceptedTypes: ['image/jpeg', 'image/png'],
        }),
      {
        wrapper: createWrapper(queryClient),
      }
    );

    const unsupportedFile = new File(['file content'], 'file.txt', {
      type: 'text/plain',
    });
    const mockFiles = [unsupportedFile];

    await act(async () => {
      result.current.handleFileSelect({
        target: { files: mockFiles },
      } as any);
    });

    expect(result.current.selectedFilesData).toHaveLength(0);
  });

  it('should handle file count limits', async () => {
    const { result } = renderHook(
      () =>
        useMultiFileUpload({
          onUpload: jest.fn(),
          onSuccess: jest.fn(),
          maxFiles: 1,
        }),
      {
        wrapper: createWrapper(queryClient),
      }
    );

    const mockFile1 = new File(['file1 content'], 'file1.jpg', {
      type: 'image/jpeg',
    });
    const mockFile2 = new File(['file2 content'], 'file2.jpg', {
      type: 'image/jpeg',
    });
    const mockFiles = [mockFile1, mockFile2];

    await act(async () => {
      result.current.handleFileSelect({
        target: { files: mockFiles },
      } as any);
    });

    expect(result.current.selectedFilesData).toHaveLength(0);
  });
});
