'use client';

import { Button } from '@/components/ui/button';
import { SheetWithDetentFull } from '@/components/ui/sheet-with-detent-full';
import { sampleEmails } from '@/lib/data/sample-emails';
import { AtSignIcon, Download, EyeIcon, FileIcon, Upload } from 'lucide-react';
import { useCallback, useState } from 'react';

interface CsvImportSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (emails: string[]) => void;
}

export default function CsvImportSheet({ isOpen, onClose, onImport }: CsvImportSheetProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [emails, setEmails] = useState<string[]>([]);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const parseCsv = useCallback((file: File): Promise<string[]> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const text = e.target?.result as string;
          const allEmails = text
            .split(/[\r\n,]+/)
            .map((e) => e.trim())
            .filter((e) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e));
          if (allEmails.length === 0) reject('No valid email addresses found');
          else resolve([...new Set(allEmails)]);
        } catch (err) {
          reject('Error parsing CSV');
        }
      };
      reader.onerror = () => reject('Error reading file');
      reader.readAsText(file);
    });
  }, []);

  const handleFileChange = async (file: File | null) => {
    if (!file) return;

    setIsLoading(true);
    setError('');

    try {
      const parsedEmails = await parseCsv(file);
      setEmails(parsedEmails);
    } catch (err) {
      setError(err as string);
      setEmails([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFileChange(e.dataTransfer.files?.[0] || null);
  };

  return (
    <SheetWithDetentFull.Root presented={isOpen} onPresentedChange={(p) => !p && onClose()}>
      <SheetWithDetentFull.Portal>
        <SheetWithDetentFull.View>
          <SheetWithDetentFull.Backdrop />
          <SheetWithDetentFull.Content className='flex flex-col rounded-t-2xl bg-white'>
            <div className='sticky top-0 z-10 border-b bg-white px-4 pb-3 pt-3'>
              <div className='mb-3 flex justify-center'>
                <SheetWithDetentFull.Handle />
              </div>
              <div className='text-center'>
                <h2 className='text-xl font-semibold'>Importing CSV Files</h2>
                <p className='mt-1 text-sm text-gray-500'>
                  How to import contacts to Evento in CSV format.
                </p>
              </div>
            </div>

            <div className='flex-1 overflow-y-auto p-6 pb-4'>
              <div className='mb-6 space-y-4'>
                <div className='flex items-start gap-3'>
                  <div className='flex h-8 w-8 rounded-full bg-gray-100 p-2'>
                    <AtSignIcon size={16} />
                  </div>
                  <div>
                    <h3 className='font-medium'>Emails Only</h3>
                    <p className='text-sm text-gray-500'>
                      Ensure your CSV file contains only emails in 1 single list.
                    </p>
                  </div>
                </div>
                <div className='flex items-start gap-3'>
                  <div className='flex h-8 w-8 rounded-full bg-gray-100 p-2'>
                    <EyeIcon size={16} />
                  </div>
                  <div>
                    <h3 className='font-medium'>Header Item</h3>
                    <p className='text-sm text-gray-500'>
                      Ensure your CSV file contains a header item.
                    </p>
                  </div>
                </div>
                <div className='flex items-start gap-3'>
                  <div className='flex h-8 w-8 rounded-full bg-gray-100 p-2'>
                    <FileIcon size={16} />
                  </div>
                  <div>
                    <h3 className='font-medium'>Use Our Template</h3>
                    <p className='text-sm text-gray-500'>
                      In case you face any problems importing CSVs, try using our demo below:
                    </p>
                  </div>
                </div>
              </div>
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragging(true);
                }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
                className={`flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-8 text-center ${
                  isDragging ? 'border-red-500 bg-red-50' : 'border-gray-300'
                }`}
              >
                <Upload className='mb-3 h-10 w-10 text-gray-400' />
                <h3 className='mb-1 text-lg font-medium'>Drag and drop your CSV file here</h3>
                <p className='mb-4 text-sm text-gray-500'>or</p>
                <label className='cursor-pointer rounded-lg bg-black px-4 py-2 text-sm font-medium text-white hover:bg-gray-800'>
                  Browse files
                  <input
                    type='file'
                    accept='.csv,text/csv'
                    onChange={(e) => handleFileChange(e.target.files?.[0] || null)}
                    className='hidden'
                  />
                </label>
                <p className='mt-2 text-xs text-gray-500'>CSV file with email addresses</p>
              </div>

              {error && (
                <div className='mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-600'>{error}</div>
              )}

              {isLoading && (
                <div className='mt-4 text-center'>
                  <div className='inline-block h-6 w-6 animate-spin rounded-full border-2 border-gray-300 border-t-red-500' />
                  <p className='mt-2 text-sm text-gray-500'>Processing file...</p>
                </div>
              )}

              {emails.length > 0 && (
                <div className='mt-6'>
                  <div className='mb-3 flex items-center justify-between'>
                    <h3 className='font-medium'>
                      Found {emails.length} email
                      {emails.length !== 1 ? 's' : ''}
                    </h3>
                    <button
                      onClick={() => setEmails([])}
                      className='text-sm text-red-600 hover:text-red-800'
                    >
                      Clear
                    </button>
                  </div>
                  <div className='max-h-40 overflow-y-auto rounded-lg border'>
                    {emails.slice(0, 10).map((email, i) => (
                      <div key={i} className='border-b p-3 text-sm last:border-b-0'>
                        {email}
                      </div>
                    ))}
                    {emails.length > 10 && (
                      <div className='bg-gray-50 p-3 text-center text-xs text-gray-500'>
                        + {emails.length - 10} more emails
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className='min-h-[11.5rem] border-t bg-white p-4'>
              <div className='space-y-3'>
                <Button
                  variant='outline'
                  onClick={() => {
                    // Download sample CSV
                    const csvContent = `email\n${sampleEmails.join('\n')}`;
                    const blob = new Blob([csvContent], { type: 'text/csv' });
                    const url = window.URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = 'evento-sample-emails.csv';
                    a.click();
                    window.URL.revokeObjectURL(url);
                  }}
                  className='w-full'
                  disabled={isLoading}
                >
                  <Download className='mr-2 h-4 w-4' />
                  Download Example CSV
                </Button>
                <Button
                  onClick={() => onImport(emails)}
                  className='w-full'
                  disabled={emails.length === 0 || isLoading}
                >
                  <Upload className='mr-2 h-4 w-4' />
                  Import CSV
                </Button>
              </div>
            </div>
          </SheetWithDetentFull.Content>
        </SheetWithDetentFull.View>
      </SheetWithDetentFull.Portal>
    </SheetWithDetentFull.Root>
  );
}
