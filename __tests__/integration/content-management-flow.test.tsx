import { useDeleteGalleryItem } from '@/lib/hooks/use-delete-gallery-item';
import { useGenerateDescription } from '@/lib/hooks/use-generate-description';
import { useMultiFileUpload } from '@/lib/hooks/use-multi-file-upload';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook } from '@testing-library/react';

// Mock the API client
jest.mock('@/lib/api/client', () => {
  const mockApiClient = {
    post: jest.fn(),
    get: jest.fn(),
    put: jest.fn(),
    patch: jest.fn(),
    delete: jest.fn(),
    request: jest.fn(),
    head: jest.fn(),
    options: jest.fn(),
    interceptors: {
      request: { use: jest.fn() },
      response: { use: jest.fn() },
    },
  };
  return {
    __esModule: true,
    default: mockApiClient,
    apiClient: mockApiClient,
  };
});

// Mock Next.js router
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

// Mock toast
jest.mock('@/lib/hooks/use-toast-manager', () => ({
  useToast: () => ({
    toast: {
      success: jest.fn(),
      error: jest.fn(),
      warning: jest.fn(),
    },
  }),
}));

describe('Content Management Integration Flow', () => {
  let queryClient: QueryClient;
  let mockApiClient: {
    get: jest.MockedFunction<any>;
    post: jest.MockedFunction<any>;
    put: jest.MockedFunction<any>;
    patch: jest.MockedFunction<any>;
    delete: jest.MockedFunction<any>;
    request: jest.MockedFunction<any>;
    head: jest.MockedFunction<any>;
    options: jest.MockedFunction<any>;
    interceptors: {
      request: { use: jest.MockedFunction<any> };
      response: { use: jest.MockedFunction<any> };
    };
  };

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });

    mockApiClient = require('@/lib/api/client').default;
    mockApiClient.get.mockClear();
    mockApiClient.post.mockClear();
    mockApiClient.delete.mockClear();
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

    mockApiClient.post.mockResolvedValueOnce({
      success: true,
      data: mockUploadResponse,
    });

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

    // Create mock files
    const mockFile1 = new File(['file1 content'], 'file1.jpg', {
      type: 'image/jpeg',
    });
    const mockFile2 = new File(['file2 content'], 'file2.jpg', {
      type: 'image/jpeg',
    });
    const mockFiles = [mockFile1, mockFile2];

    // Simulate file selection
    await act(async () => {
      result.current.handleFileSelect({
        target: { files: mockFiles },
      } as any);
    });

    expect(result.current.selectedFilesData).toHaveLength(2);
    expect(result.current.isUploading).toBe(false);

    // Simulate upload
    await act(async () => {
      result.current.uploadFiles();
    });

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 100));
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
          maxFileSize: 1, // 1MB limit
        }),
      {
        wrapper: createWrapper(queryClient),
      }
    );

    // Create a file that's too large
    const largeFile = new File(['x'.repeat(2 * 1024 * 1024)], 'large.jpg', {
      type: 'image/jpeg',
    });
    const mockFiles = [largeFile];

    await act(async () => {
      result.current.handleFileSelect({
        target: { files: mockFiles },
      } as any);
    });

    // Should not add the file due to size validation
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

    // Create mock files
    const mockFile = new File(['file content'], 'file.jpg', {
      type: 'image/jpeg',
    });
    const mockFiles = [mockFile];

    // Simulate file selection
    await act(async () => {
      result.current.handleFileSelect({
        target: { files: mockFiles },
      } as any);
    });

    // Simulate upload
    await act(async () => {
      result.current.uploadFiles();
    });

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 100));
    });

    expect(mockOnUpload).toHaveBeenCalled();
    expect(result.current.isUploading).toBe(false);
    expect(result.current.uploadProgressIndividual.some((p) => p.status === 'failed')).toBe(true);
  });

  it('should handle AI description generation', async () => {
    const mockDescriptionResponse = {
      description: 'An amazing event with great music and food!',
    };

    mockApiClient.post.mockResolvedValueOnce(mockDescriptionResponse);

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
      await new Promise((resolve) => setTimeout(resolve, 100));
    });

    expect(mockApiClient.post).toHaveBeenCalledWith(
      '/v1/events/generate-description',
      generateData,
      { timeout: 60000 }
    );
    expect(result.current.data).toEqual(mockDescriptionResponse);
    expect(result.current.isPending).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('should handle description generation errors', async () => {
    mockApiClient.post.mockRejectedValueOnce(new Error('AI service unavailable'));

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
      await new Promise((resolve) => setTimeout(resolve, 100));
    });

    expect(mockApiClient.post).toHaveBeenCalledWith(
      '/v1/events/generate-description',
      generateData,
      { timeout: 60000 }
    );
    expect(result.current.isPending).toBe(false);
    expect(result.current.error).toBeTruthy();
  });

  it('should handle gallery item deletion', async () => {
    const mockDeleteResponse = {
      success: true,
      message: 'Gallery item deleted successfully',
    };

    mockApiClient.delete.mockResolvedValueOnce({
      success: true,
      data: mockDeleteResponse,
    });

    const { result } = renderHook(() => useDeleteGalleryItem(), {
      wrapper: createWrapper(queryClient),
    });

    await act(async () => {
      result.current.mutate({ galleryItemId: 'gallery1', eventId: 'event123' });
    });

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 100));
    });

    expect(mockApiClient.delete).toHaveBeenCalledWith('/v1/events/gallery?id=gallery1');
    expect(result.current.isPending).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('should handle gallery deletion errors', async () => {
    mockApiClient.delete.mockRejectedValueOnce(new Error('Delete failed'));

    const { result } = renderHook(() => useDeleteGalleryItem(), {
      wrapper: createWrapper(queryClient),
    });

    await act(async () => {
      result.current.mutate({ galleryItemId: 'gallery1', eventId: 'event123' });
    });

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 100));
    });

    expect(mockApiClient.delete).toHaveBeenCalledWith('/v1/events/gallery?id=gallery1');
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

    // Create a file with unsupported type
    const unsupportedFile = new File(['file content'], 'file.txt', {
      type: 'text/plain',
    });
    const mockFiles = [unsupportedFile];

    await act(async () => {
      result.current.handleFileSelect({
        target: { files: mockFiles },
      } as any);
    });

    // Should not add the file due to type validation
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

    // Create multiple files exceeding the limit
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

    // Should not add files due to count limit
    expect(result.current.selectedFilesData).toHaveLength(0);
  });
});
