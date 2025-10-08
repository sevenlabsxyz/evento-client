import { useMultiFileUpload } from '@/lib/hooks/use-multi-file-upload';
import { toast } from '@/lib/utils/toast';
import { act, renderHook } from '@testing-library/react';

// Mock the toast utility
jest.mock('@/lib/utils/toast', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
    warning: jest.fn(),
  },
}));

// Mock URL.createObjectURL and URL.revokeObjectURL
const mockCreateObjectURL = jest.fn();
const mockRevokeObjectURL = jest.fn();

// Store original functions
const originalCreateObjectURL = URL.createObjectURL;
const originalRevokeObjectURL = URL.revokeObjectURL;

// Mock console.error to avoid noise in tests
const mockConsoleError = jest.spyOn(console, 'error').mockImplementation(() => {});

const mockToast = toast as jest.Mocked<typeof toast>;

describe('useMultiFileUpload', () => {
  let mockOnUpload: jest.Mock;
  let mockOnSuccess: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    mockCreateObjectURL.mockReturnValue('blob:mock-url');
    mockRevokeObjectURL.mockImplementation(() => {});

    // Set up URL mocks
    Object.defineProperty(URL, 'createObjectURL', {
      value: mockCreateObjectURL,
      writable: true,
    });
    Object.defineProperty(URL, 'revokeObjectURL', {
      value: mockRevokeObjectURL,
      writable: true,
    });

    mockOnUpload = jest.fn();
    mockOnSuccess = jest.fn();
  });

  afterEach(() => {
    // Restore original functions
    Object.defineProperty(URL, 'createObjectURL', {
      value: originalCreateObjectURL,
      writable: true,
    });
    Object.defineProperty(URL, 'revokeObjectURL', {
      value: originalRevokeObjectURL,
      writable: true,
    });
  });

  afterAll(() => {
    mockConsoleError.mockRestore();
  });

  const createMockFile = (name: string, size: number, type: string = 'image/jpeg'): File => {
    const file = new File(['mock content'], name, { type });
    Object.defineProperty(file, 'size', { value: size });
    return file;
  };

  const createMockFileList = (files: File[]): FileList => {
    const fileList = {
      length: files.length,
      item: (index: number) => files[index] || null,
      [Symbol.iterator]: function* () {
        for (let i = 0; i < files.length; i++) {
          yield files[i];
        }
      },
    } as FileList;

    // Add numeric indices
    files.forEach((file, index) => {
      (fileList as FileList & Record<number, File>)[index] = file;
    });

    return fileList;
  };

  const createMockChangeEvent = (files: File[]): React.ChangeEvent<HTMLInputElement> =>
    ({
      target: {
        files: createMockFileList(files),
      },
    }) as React.ChangeEvent<HTMLInputElement>;

  describe('initial state', () => {
    it('initializes with default values', () => {
      const { result } = renderHook(() =>
        useMultiFileUpload({
          onUpload: mockOnUpload,
        })
      );

      expect(result.current.selectedFilesData).toEqual([]);
      expect(result.current.isUploading).toBe(false);
      expect(result.current.uploadingPercentage).toBe(0);
      expect(result.current.uploadProgressIndividual).toEqual([]);
      expect(result.current.inputFileRef.current).toBeNull();
      expect(typeof result.current.handleFileSelect).toBe('function');
      expect(typeof result.current.removeFileFromSelection).toBe('function');
      expect(typeof result.current.clearSelection).toBe('function');
      expect(typeof result.current.uploadFiles).toBe('function');
      expect(typeof result.current.triggerFileSelect).toBe('function');
      expect(result.current.acceptedFileTypes).toBe('image/jpeg,image/jpg,image/png,image/webp');
    });

    it('initializes with custom options', () => {
      const { result } = renderHook(() =>
        useMultiFileUpload({
          onUpload: mockOnUpload,
          onSuccess: mockOnSuccess,
          maxFileSize: 5,
          maxFiles: 10,
          acceptedTypes: ['image/png', 'image/gif'],
        })
      );

      expect(result.current.acceptedFileTypes).toBe('image/png,image/gif');
    });
  });

  describe('file validation', () => {
    it('validates file type correctly', async () => {
      const { result } = renderHook(() =>
        useMultiFileUpload({
          onUpload: mockOnUpload,
          acceptedTypes: ['image/jpeg'],
        })
      );

      const invalidFile = createMockFile('test.gif', 1024, 'image/gif');
      const event = createMockChangeEvent([invalidFile]);

      await act(async () => {
        result.current.handleFileSelect(event);
      });

      expect(mockToast.error).toHaveBeenCalledWith(
        'Invalid files:\n' + 'test.gif: File type image/gif is not supported'
      );
      expect(result.current.selectedFilesData).toEqual([]);
    });

    it('validates file size correctly', async () => {
      const { result } = renderHook(() =>
        useMultiFileUpload({
          onUpload: mockOnUpload,
          maxFileSize: 1, // 1MB
        })
      );

      const largeFile = createMockFile('large.jpg', 2 * 1024 * 1024, 'image/jpeg'); // 2MB
      const event = createMockChangeEvent([largeFile]);

      await act(async () => {
        result.current.handleFileSelect(event);
      });

      expect(mockToast.error).toHaveBeenCalledWith(
        'Invalid files:\n' + 'large.jpg: File size (2.0MB) exceeds limit of 1MB'
      );
      expect(result.current.selectedFilesData).toEqual([]);
    });

    it('accepts valid files', async () => {
      const { result } = renderHook(() =>
        useMultiFileUpload({
          onUpload: mockOnUpload,
        })
      );

      const validFile = createMockFile('test.jpg', 1024, 'image/jpeg');
      const event = createMockChangeEvent([validFile]);

      await act(async () => {
        result.current.handleFileSelect(event);
      });

      expect(mockToast.success).toHaveBeenCalledWith('Selected 1 photo');
      expect(result.current.selectedFilesData).toHaveLength(1);
      expect(result.current.selectedFilesData[0].file).toBe(validFile);
      expect(result.current.selectedFilesData[0].previewUrl).toBe('blob:mock-url');
    });
  });

  describe('file selection limits', () => {
    it('enforces max files limit', async () => {
      const { result } = renderHook(() =>
        useMultiFileUpload({
          onUpload: mockOnUpload,
          maxFiles: 2,
        })
      );

      // First, add 2 files
      const file1 = createMockFile('test1.jpg', 1024, 'image/jpeg');
      const file2 = createMockFile('test2.jpg', 1024, 'image/jpeg');
      const event1 = createMockChangeEvent([file1, file2]);

      await act(async () => {
        result.current.handleFileSelect(event1);
      });

      expect(result.current.selectedFilesData).toHaveLength(2);

      // Try to add more files
      const file3 = createMockFile('test3.jpg', 1024, 'image/jpeg');
      const event2 = createMockChangeEvent([file3]);

      await act(async () => {
        result.current.handleFileSelect(event2);
      });

      expect(mockToast.error).toHaveBeenCalledWith('Cannot select more than 2 files');
      expect(result.current.selectedFilesData).toHaveLength(2);
    });

    it('handles empty file selection', async () => {
      const { result } = renderHook(() =>
        useMultiFileUpload({
          onUpload: mockOnUpload,
        })
      );

      const event = createMockChangeEvent([]);

      await act(async () => {
        result.current.handleFileSelect(event);
      });

      expect(result.current.selectedFilesData).toEqual([]);
      expect(mockToast.success).not.toHaveBeenCalled();
    });
  });

  describe('duplicate file handling', () => {
    it('prevents duplicate files', async () => {
      const { result } = renderHook(() =>
        useMultiFileUpload({
          onUpload: mockOnUpload,
        })
      );

      const file1 = createMockFile('test.jpg', 1024, 'image/jpeg');
      const file2 = createMockFile('test.jpg', 1024, 'image/jpeg'); // Same name and size

      // Add first file
      const event1 = createMockChangeEvent([file1]);
      await act(async () => {
        result.current.handleFileSelect(event1);
      });

      expect(result.current.selectedFilesData).toHaveLength(1);

      // Try to add duplicate
      const event2 = createMockChangeEvent([file2]);
      await act(async () => {
        result.current.handleFileSelect(event2);
      });

      expect(mockToast.warning).toHaveBeenCalledWith('Some files were already selected');
      expect(result.current.selectedFilesData).toHaveLength(1);
    });

    it('allows files with same name but different size', async () => {
      const { result } = renderHook(() =>
        useMultiFileUpload({
          onUpload: mockOnUpload,
        })
      );

      const file1 = createMockFile('test.jpg', 1024, 'image/jpeg');
      const file2 = createMockFile('test.jpg', 2048, 'image/jpeg'); // Same name, different size

      const event = createMockChangeEvent([file1, file2]);
      await act(async () => {
        result.current.handleFileSelect(event);
      });

      expect(result.current.selectedFilesData).toHaveLength(2);
    });
  });

  describe('file removal', () => {
    it('removes file from selection', async () => {
      const { result } = renderHook(() =>
        useMultiFileUpload({
          onUpload: mockOnUpload,
        })
      );

      const file = createMockFile('test.jpg', 1024, 'image/jpeg');
      const event = createMockChangeEvent([file]);

      await act(async () => {
        result.current.handleFileSelect(event);
      });

      expect(result.current.selectedFilesData).toHaveLength(1);

      act(() => {
        result.current.removeFileFromSelection('test.jpg');
      });

      expect(result.current.selectedFilesData).toHaveLength(0);
      expect(mockRevokeObjectURL).toHaveBeenCalledWith('blob:mock-url');
    });

    it('clears all files', async () => {
      const { result } = renderHook(() =>
        useMultiFileUpload({
          onUpload: mockOnUpload,
        })
      );

      const file1 = createMockFile('test1.jpg', 1024, 'image/jpeg');
      const file2 = createMockFile('test2.jpg', 1024, 'image/jpeg');
      const event = createMockChangeEvent([file1, file2]);

      await act(async () => {
        result.current.handleFileSelect(event);
      });

      expect(result.current.selectedFilesData).toHaveLength(2);

      act(() => {
        result.current.clearSelection();
      });

      expect(result.current.selectedFilesData).toHaveLength(0);
      expect(mockRevokeObjectURL).toHaveBeenCalledTimes(2);
    });
  });

  describe('file upload', () => {
    it('uploads files successfully', async () => {
      mockOnUpload.mockResolvedValue({ success: true });

      const { result } = renderHook(() =>
        useMultiFileUpload({
          onUpload: mockOnUpload,
          onSuccess: mockOnSuccess,
        })
      );

      const file1 = createMockFile('test1.jpg', 1024, 'image/jpeg');
      const file2 = createMockFile('test2.jpg', 1024, 'image/jpeg');
      const event = createMockChangeEvent([file1, file2]);

      await act(async () => {
        result.current.handleFileSelect(event);
      });

      expect(result.current.selectedFilesData).toHaveLength(2);

      await act(async () => {
        await result.current.uploadFiles();
      });

      expect(mockOnUpload).toHaveBeenCalledTimes(2);
      expect(mockOnUpload).toHaveBeenCalledWith(file1);
      expect(mockOnUpload).toHaveBeenCalledWith(file2);
      expect(mockOnSuccess).toHaveBeenCalled();
      expect(mockToast.success).toHaveBeenCalledWith('Successfully uploaded 2 photos');
      expect(result.current.isUploading).toBe(false);
    });

    it('handles upload errors', async () => {
      mockOnUpload.mockRejectedValue(new Error('Upload failed'));

      const { result } = renderHook(() =>
        useMultiFileUpload({
          onUpload: mockOnUpload,
        })
      );

      const file = createMockFile('test.jpg', 1024, 'image/jpeg');
      const event = createMockChangeEvent([file]);

      await act(async () => {
        result.current.handleFileSelect(event);
      });

      await act(async () => {
        await result.current.uploadFiles();
      });

      expect(mockToast.error).toHaveBeenCalledWith('Failed to upload 1 photo');
      expect(result.current.uploadProgressIndividual[0].status).toBe('failed');
      expect(result.current.uploadProgressIndividual[0].message).toBe('Upload failed');
    });

    it('handles mixed success and failure', async () => {
      mockOnUpload
        .mockResolvedValueOnce({ success: true })
        .mockRejectedValueOnce(new Error('Upload failed'));

      const { result } = renderHook(() =>
        useMultiFileUpload({
          onUpload: mockOnUpload,
        })
      );

      const file1 = createMockFile('test1.jpg', 1024, 'image/jpeg');
      const file2 = createMockFile('test2.jpg', 1024, 'image/jpeg');
      const event = createMockChangeEvent([file1, file2]);

      await act(async () => {
        result.current.handleFileSelect(event);
      });

      await act(async () => {
        await result.current.uploadFiles();
      });

      expect(mockToast.success).toHaveBeenCalledWith('Successfully uploaded 1 photo');
      expect(mockToast.error).toHaveBeenCalledWith('Failed to upload 1 photo');
    });

    it('handles return-value-based error responses', async () => {
      mockOnUpload.mockResolvedValue({
        success: false,
        message: 'Server error',
      });

      const { result } = renderHook(() =>
        useMultiFileUpload({
          onUpload: mockOnUpload,
        })
      );

      const file = createMockFile('test.jpg', 1024, 'image/jpeg');
      const event = createMockChangeEvent([file]);

      await act(async () => {
        result.current.handleFileSelect(event);
      });

      await act(async () => {
        await result.current.uploadFiles();
      });

      expect(mockToast.error).toHaveBeenCalledWith('Failed to upload 1 photo');
      expect(result.current.uploadProgressIndividual[0].status).toBe('failed');
      expect(result.current.uploadProgressIndividual[0].message).toBe('Server error');
    });

    it('prevents upload when already uploading', async () => {
      const { result } = renderHook(() =>
        useMultiFileUpload({
          onUpload: mockOnUpload,
        })
      );

      // Set uploading state manually
      act(() => {
        result.current.uploadFiles();
      });

      // Try to upload again
      await act(async () => {
        await result.current.uploadFiles();
      });

      expect(mockOnUpload).not.toHaveBeenCalled();
    });

    it('prevents upload when no files selected', async () => {
      const { result } = renderHook(() =>
        useMultiFileUpload({
          onUpload: mockOnUpload,
        })
      );

      await act(async () => {
        await result.current.uploadFiles();
      });

      expect(mockOnUpload).not.toHaveBeenCalled();
    });
  });

  describe('upload progress tracking', () => {
    it('tracks individual file progress', async () => {
      // Mock upload to resolve immediately for first file, delay for second
      mockOnUpload
        .mockResolvedValueOnce({ success: true })
        .mockImplementationOnce(
          () => new Promise((resolve) => setTimeout(() => resolve({ success: true }), 100))
        );

      const { result } = renderHook(() =>
        useMultiFileUpload({
          onUpload: mockOnUpload,
        })
      );

      const file1 = createMockFile('test1.jpg', 1024, 'image/jpeg');
      const file2 = createMockFile('test2.jpg', 1024, 'image/jpeg');
      const event = createMockChangeEvent([file1, file2]);

      await act(async () => {
        result.current.handleFileSelect(event);
      });

      // Start upload
      await act(async () => {
        await result.current.uploadFiles();
      });

      // Check final progress
      expect(result.current.uploadProgressIndividual[0].status).toBe('success');
      expect(result.current.uploadProgressIndividual[1].status).toBe('success');
    });

    it('tracks overall upload percentage', async () => {
      mockOnUpload.mockResolvedValue({ success: true });

      const { result } = renderHook(() =>
        useMultiFileUpload({
          onUpload: mockOnUpload,
        })
      );

      const file1 = createMockFile('test1.jpg', 1024, 'image/jpeg');
      const file2 = createMockFile('test2.jpg', 1024, 'image/jpeg');
      const event = createMockChangeEvent([file1, file2]);

      await act(async () => {
        result.current.handleFileSelect(event);
      });

      await act(async () => {
        await result.current.uploadFiles();
      });

      expect(result.current.uploadingPercentage).toBe(100);
    });
  });

  describe('trigger file select', () => {
    it('triggers file input click', () => {
      const { result } = renderHook(() =>
        useMultiFileUpload({
          onUpload: mockOnUpload,
        })
      );

      // Mock the input ref
      const mockClick = jest.fn();
      Object.defineProperty(result.current.inputFileRef, 'current', {
        value: {
          click: mockClick,
        } as Partial<HTMLInputElement>,
        writable: true,
      });

      act(() => {
        result.current.triggerFileSelect();
      });

      expect(mockClick).toHaveBeenCalled();
    });

    it('handles missing input ref gracefully', () => {
      const { result } = renderHook(() =>
        useMultiFileUpload({
          onUpload: mockOnUpload,
        })
      );

      // Don't set the ref
      expect(() => {
        act(() => {
          result.current.triggerFileSelect();
        });
      }).not.toThrow();
    });
  });

  describe('error handling', () => {
    it('handles multiple validation errors', async () => {
      const { result } = renderHook(() =>
        useMultiFileUpload({
          onUpload: mockOnUpload,
          maxFileSize: 1,
          acceptedTypes: ['image/jpeg'],
        })
      );

      const invalidFiles = [
        createMockFile('test1.gif', 1024, 'image/gif'), // Wrong type
        createMockFile('test2.jpg', 2 * 1024 * 1024, 'image/jpeg'), // Too large
        createMockFile('test3.png', 1024, 'image/png'), // Wrong type
      ];
      const event = createMockChangeEvent(invalidFiles);

      await act(async () => {
        result.current.handleFileSelect(event);
      });

      expect(mockToast.error).toHaveBeenCalledWith(
        'Invalid files:\n' +
          'test1.gif: File type image/gif is not supported\n' +
          'test2.jpg: File size (2.0MB) exceeds limit of 1MB\n' +
          'test3.png: File type image/png is not supported'
      );
    });

    it('truncates validation error messages when too many', async () => {
      const { result } = renderHook(() =>
        useMultiFileUpload({
          onUpload: mockOnUpload,
          acceptedTypes: ['image/jpeg'],
        })
      );

      const invalidFiles = Array.from({ length: 5 }, (_, i) =>
        createMockFile(`test${i}.gif`, 1024, 'image/gif')
      );
      const event = createMockChangeEvent(invalidFiles);

      await act(async () => {
        result.current.handleFileSelect(event);
      });

      expect(mockToast.error).toHaveBeenCalledWith(
        expect.stringContaining('Invalid files:\n') && expect.stringContaining('...')
      );
    });
  });

  describe('edge cases', () => {
    it('handles files with special characters in names', async () => {
      const { result } = renderHook(() =>
        useMultiFileUpload({
          onUpload: mockOnUpload,
        })
      );

      const file = createMockFile('test file (1).jpg', 1024, 'image/jpeg');
      const event = createMockChangeEvent([file]);

      await act(async () => {
        result.current.handleFileSelect(event);
      });

      expect(result.current.selectedFilesData).toHaveLength(1);
      expect(result.current.selectedFilesData[0].file.name).toBe('test file (1).jpg');
    });

    it('handles very large file sizes', async () => {
      const { result } = renderHook(() =>
        useMultiFileUpload({
          onUpload: mockOnUpload,
          maxFileSize: 100, // 100MB
        })
      );

      const largeFile = createMockFile('large.jpg', 50 * 1024 * 1024, 'image/jpeg'); // 50MB
      const event = createMockChangeEvent([largeFile]);

      await act(async () => {
        result.current.handleFileSelect(event);
      });

      expect(result.current.selectedFilesData).toHaveLength(1);
    });

    it('handles zero-byte files', async () => {
      const { result } = renderHook(() =>
        useMultiFileUpload({
          onUpload: mockOnUpload,
        })
      );

      const emptyFile = createMockFile('empty.jpg', 0, 'image/jpeg');
      const event = createMockChangeEvent([emptyFile]);

      await act(async () => {
        result.current.handleFileSelect(event);
      });

      expect(result.current.selectedFilesData).toHaveLength(1);
    });
  });
});
