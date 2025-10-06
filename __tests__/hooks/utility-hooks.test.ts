import { QueryClient } from '@tanstack/react-query';
import { act, renderHook } from '@testing-library/react';

// Mock the toast utility
jest.mock('@/lib/utils/toast', () => ({
  toast: {
    error: jest.fn(),
    warning: jest.fn(),
    success: jest.fn(),
  },
  toastManager: {
    getToasts: jest.fn(() => []),
    subscribe: jest.fn(() => () => {}),
    remove: jest.fn(),
  },
}));

import { useMultiFileUpload } from '@/lib/hooks/use-multi-file-upload';
import { useToastManager } from '@/lib/hooks/use-toast-manager';

describe('Utility Hooks', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
    jest.clearAllMocks();
  });

  describe('useMultiFileUpload', () => {
    const mockOnUpload = jest.fn();
    const mockOnSuccess = jest.fn();

    const defaultOptions = {
      onUpload: mockOnUpload,
      onSuccess: mockOnSuccess,
    };

    beforeEach(() => {
      mockOnUpload.mockClear();
      mockOnSuccess.mockClear();
    });

    it('initializes with default state', () => {
      const { result } = renderHook(() => useMultiFileUpload(defaultOptions));

      expect(result.current.selectedFilesData).toEqual([]);
      expect(result.current.isUploading).toBe(false);
      expect(result.current.uploadingPercentage).toBe(0);
      expect(result.current.uploadProgressIndividual).toEqual([]);
      expect(result.current.acceptedFileTypes).toBe(
        'image/jpeg,image/jpg,image/png,image/webp'
      );
    });

    it('uses custom options correctly', () => {
      const customOptions = {
        ...defaultOptions,
        maxFileSize: 5,
        maxFiles: 10,
        acceptedTypes: ['image/png'],
      };

      const { result } = renderHook(() => useMultiFileUpload(customOptions));

      expect(result.current.acceptedFileTypes).toBe('image/png');
    });

    it('validates file type correctly', () => {
      const { result } = renderHook(() => useMultiFileUpload(defaultOptions));

      // Create a mock file input event
      const mockFile = new File(['test'], 'test.txt', { type: 'text/plain' });
      const mockEvent = {
        target: {
          files: [mockFile],
          value: '',
        },
      } as any;

      act(() => {
        result.current.handleFileSelect(mockEvent);
      });

      expect(result.current.selectedFilesData).toEqual([]);
    });

    it('validates file size correctly', () => {
      const { result } = renderHook(() =>
        useMultiFileUpload({
          ...defaultOptions,
          maxFileSize: 1, // 1MB
        })
      );

      // Create a mock file that's too large
      const mockFile = new File(['x'.repeat(2 * 1024 * 1024)], 'test.jpg', {
        type: 'image/jpeg',
      });
      const mockEvent = {
        target: {
          files: [mockFile],
          value: '',
        },
      } as any;

      act(() => {
        result.current.handleFileSelect(mockEvent);
      });

      expect(result.current.selectedFilesData).toEqual([]);
    });

    it('handles valid file selection', () => {
      const { result } = renderHook(() => useMultiFileUpload(defaultOptions));

      // Create a mock valid file
      const mockFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
      const mockEvent = {
        target: {
          files: [mockFile],
          value: '',
        },
      } as any;

      // Mock URL.createObjectURL
      const mockUrl = 'blob:mock-url';
      jest.spyOn(URL, 'createObjectURL').mockReturnValue(mockUrl);

      act(() => {
        result.current.handleFileSelect(mockEvent);
      });

      expect(result.current.selectedFilesData).toHaveLength(1);
      expect(result.current.selectedFilesData[0].file).toBe(mockFile);
      expect(result.current.selectedFilesData[0].previewUrl).toBe(mockUrl);
    });

    it('handles multiple file selection', () => {
      const { result } = renderHook(() => useMultiFileUpload(defaultOptions));

      const mockFiles = [
        new File(['test1'], 'test1.jpg', { type: 'image/jpeg' }),
        new File(['test2'], 'test2.jpg', { type: 'image/jpeg' }),
      ];

      const mockEvent = {
        target: {
          files: mockFiles,
          value: '',
        },
      } as any;

      jest.spyOn(URL, 'createObjectURL').mockReturnValue('blob:mock-url');

      act(() => {
        result.current.handleFileSelect(mockEvent);
      });

      expect(result.current.selectedFilesData).toHaveLength(2);
    });

    it('prevents duplicate file selection', () => {
      const { result } = renderHook(() => useMultiFileUpload(defaultOptions));

      const mockFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
      jest.spyOn(URL, 'createObjectURL').mockReturnValue('blob:mock-url');

      // Select file first time
      const mockEvent1 = {
        target: { files: [mockFile], value: '' },
      } as any;

      act(() => {
        result.current.handleFileSelect(mockEvent1);
      });

      expect(result.current.selectedFilesData).toHaveLength(1);

      // Try to select same file again
      const mockEvent2 = {
        target: { files: [mockFile], value: '' },
      } as any;

      act(() => {
        result.current.handleFileSelect(mockEvent2);
      });

      expect(result.current.selectedFilesData).toHaveLength(1);
    });

    it('enforces max files limit', () => {
      const { result } = renderHook(() =>
        useMultiFileUpload({
          ...defaultOptions,
          maxFiles: 1,
        })
      );

      const mockFiles = [
        new File(['test1'], 'test1.jpg', { type: 'image/jpeg' }),
        new File(['test2'], 'test2.jpg', { type: 'image/jpeg' }),
      ];

      const mockEvent = {
        target: {
          files: mockFiles,
          value: '',
        },
      } as any;

      jest.spyOn(URL, 'createObjectURL').mockReturnValue('blob:mock-url');

      act(() => {
        result.current.handleFileSelect(mockEvent);
      });

      expect(result.current.selectedFilesData).toHaveLength(0);
    });

    it('removes file from selection', () => {
      const { result } = renderHook(() => useMultiFileUpload(defaultOptions));

      const mockFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
      jest.spyOn(URL, 'createObjectURL').mockReturnValue('blob:mock-url');

      // Select file first
      const mockEvent = {
        target: { files: [mockFile], value: '' },
      } as any;

      act(() => {
        result.current.handleFileSelect(mockEvent);
      });

      expect(result.current.selectedFilesData).toHaveLength(1);

      // Remove file
      act(() => {
        result.current.removeFileFromSelection('test.jpg');
      });

      expect(result.current.selectedFilesData).toHaveLength(0);
    });

    it('clears all files from selection', () => {
      const { result } = renderHook(() => useMultiFileUpload(defaultOptions));

      const mockFiles = [
        new File(['test1'], 'test1.jpg', { type: 'image/jpeg' }),
        new File(['test2'], 'test2.jpg', { type: 'image/jpeg' }),
      ];

      jest.spyOn(URL, 'createObjectURL').mockReturnValue('blob:mock-url');

      // Select files
      const mockEvent = {
        target: { files: mockFiles, value: '' },
      } as any;

      act(() => {
        result.current.handleFileSelect(mockEvent);
      });

      expect(result.current.selectedFilesData).toHaveLength(2);

      // Clear all
      act(() => {
        result.current.clearSelection();
      });

      expect(result.current.selectedFilesData).toHaveLength(0);
    });

    it('uploads files successfully', async () => {
      mockOnUpload.mockResolvedValue({ success: true });

      const { result } = renderHook(() => useMultiFileUpload(defaultOptions));

      const mockFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
      jest.spyOn(URL, 'createObjectURL').mockReturnValue('blob:mock-url');

      // Select file
      const mockEvent = {
        target: { files: [mockFile], value: '' },
      } as any;

      act(() => {
        result.current.handleFileSelect(mockEvent);
      });

      expect(result.current.selectedFilesData).toHaveLength(1);

      // Upload files
      await act(async () => {
        await result.current.uploadFiles();
      });

      expect(mockOnUpload).toHaveBeenCalledWith(mockFile);
      expect(mockOnSuccess).toHaveBeenCalled();
      expect(result.current.isUploading).toBe(false);
    });

    it('handles upload errors', async () => {
      mockOnUpload.mockRejectedValue(new Error('Upload failed'));

      const { result } = renderHook(() => useMultiFileUpload(defaultOptions));

      const mockFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
      jest.spyOn(URL, 'createObjectURL').mockReturnValue('blob:mock-url');

      // Select file
      const mockEvent = {
        target: { files: [mockFile], value: '' },
      } as any;

      act(() => {
        result.current.handleFileSelect(mockEvent);
      });

      // Upload files
      await act(async () => {
        await result.current.uploadFiles();
      });

      expect(mockOnUpload).toHaveBeenCalledWith(mockFile);
      expect(mockOnSuccess).not.toHaveBeenCalled();
      expect(result.current.isUploading).toBe(false);
    });

    it('handles upload failure with return value', async () => {
      mockOnUpload.mockResolvedValue({
        success: false,
        message: 'Upload failed',
      });

      const { result } = renderHook(() => useMultiFileUpload(defaultOptions));

      const mockFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
      jest.spyOn(URL, 'createObjectURL').mockReturnValue('blob:mock-url');

      // Select file
      const mockEvent = {
        target: { files: [mockFile], value: '' },
      } as any;

      act(() => {
        result.current.handleFileSelect(mockEvent);
      });

      // Upload files
      await act(async () => {
        await result.current.uploadFiles();
      });

      expect(mockOnUpload).toHaveBeenCalledWith(mockFile);
      expect(mockOnSuccess).not.toHaveBeenCalled();
      expect(result.current.isUploading).toBe(false);
    });

    it('prevents upload when no files selected', async () => {
      const { result } = renderHook(() => useMultiFileUpload(defaultOptions));

      await act(async () => {
        await result.current.uploadFiles();
      });

      expect(mockOnUpload).not.toHaveBeenCalled();
      expect(mockOnSuccess).not.toHaveBeenCalled();
    });

    it('prevents upload when already uploading', async () => {
      const { result } = renderHook(() => useMultiFileUpload(defaultOptions));

      const mockFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
      jest.spyOn(URL, 'createObjectURL').mockReturnValue('blob:mock-url');

      // Select file
      const mockEvent = {
        target: { files: [mockFile], value: '' },
      } as any;

      act(() => {
        result.current.handleFileSelect(mockEvent);
      });

      // Start upload
      act(() => {
        result.current.uploadFiles();
      });

      // Try to upload again while uploading
      await act(async () => {
        await result.current.uploadFiles();
      });

      // Should only be called once
      expect(mockOnUpload).toHaveBeenCalledTimes(1);
    });

    it('tracks upload progress correctly', async () => {
      mockOnUpload.mockResolvedValue({ success: true });

      const { result } = renderHook(() => useMultiFileUpload(defaultOptions));

      const mockFiles = [
        new File(['test1'], 'test1.jpg', { type: 'image/jpeg' }),
        new File(['test2'], 'test2.jpg', { type: 'image/jpeg' }),
      ];

      jest.spyOn(URL, 'createObjectURL').mockReturnValue('blob:mock-url');

      // Select files
      const mockEvent = {
        target: { files: mockFiles, value: '' },
      } as any;

      act(() => {
        result.current.handleFileSelect(mockEvent);
      });

      // Upload files
      await act(async () => {
        await result.current.uploadFiles();
      });

      expect(result.current.uploadingPercentage).toBe(100);
      expect(result.current.uploadProgressIndividual).toHaveLength(2);
      expect(result.current.uploadProgressIndividual[0].status).toBe('success');
      expect(result.current.uploadProgressIndividual[1].status).toBe('success');
    });

    it('clears input after file selection', () => {
      const { result } = renderHook(() => useMultiFileUpload(defaultOptions));

      const mockFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
      const mockInput = { value: 'test' };
      const mockEvent = {
        target: {
          files: [mockFile],
          value: 'test',
        },
      } as any;

      // Mock the input ref
      (result.current.inputFileRef as any).current = mockInput as any;

      jest.spyOn(URL, 'createObjectURL').mockReturnValue('blob:mock-url');

      act(() => {
        result.current.handleFileSelect(mockEvent);
      });

      expect(mockInput.value).toBe('');
    });

    it('triggers file select when triggerFileSelect is called', () => {
      const { result } = renderHook(() => useMultiFileUpload(defaultOptions));

      const mockClick = jest.fn();
      const mockInput = { click: mockClick };
      (result.current.inputFileRef as any).current = mockInput as any;

      act(() => {
        result.current.triggerFileSelect();
      });

      expect(mockClick).toHaveBeenCalled();
    });
  });

  describe('useToastManager', () => {
    it('initializes with current toasts', () => {
      const { toastManager } = require('@/lib/utils/toast');
      const mockToasts = [{ id: '1', message: 'Test toast' }];
      toastManager.getToasts.mockReturnValue(mockToasts);

      const { result } = renderHook(() => useToastManager());

      expect(result.current.toasts).toEqual(mockToasts);
      expect(toastManager.getToasts).toHaveBeenCalled();
    });

    it('subscribes to toast changes', () => {
      const { toastManager } = require('@/lib/utils/toast');
      const mockUnsubscribe = jest.fn();
      toastManager.subscribe.mockReturnValue(mockUnsubscribe);

      const { unmount } = renderHook(() => useToastManager());

      expect(toastManager.subscribe).toHaveBeenCalled();

      unmount();

      expect(mockUnsubscribe).toHaveBeenCalled();
    });

    it('provides removeToast function', () => {
      const { toastManager } = require('@/lib/utils/toast');
      toastManager.getToasts.mockReturnValue([]);

      const { result } = renderHook(() => useToastManager());

      act(() => {
        result.current.removeToast('toast-id');
      });

      expect(toastManager.remove).toHaveBeenCalledWith('toast-id');
    });

    it('updates toasts when subscription fires', () => {
      const { toastManager } = require('@/lib/utils/toast');
      let subscriptionCallback: (toasts: any[]) => void = () => {};

      toastManager.getToasts.mockReturnValue([]);
      toastManager.subscribe.mockImplementation(
        (callback: (toasts: any[]) => void) => {
          subscriptionCallback = callback;
          return () => {};
        }
      );

      const { result } = renderHook(() => useToastManager());

      const newToasts = [{ id: '2', message: 'New toast' }];

      act(() => {
        subscriptionCallback(newToasts);
      });

      expect(result.current.toasts).toEqual(newToasts);
    });
  });
});
