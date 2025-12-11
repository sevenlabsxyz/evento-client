'use client';

import { Paperclip, X } from 'lucide-react';

interface AttachmentPreviewProps {
  attachments: File[];
  onRemove: (index: number) => void;
}

export function AttachmentPreview({ attachments, onRemove }: AttachmentPreviewProps) {
  if (attachments.length === 0) return null;

  return (
    <div className='max-w-full overflow-x-auto'>
      <div className='flex w-max gap-2 border-b p-2'>
        {attachments.map((file, index) => (
          <div key={index} className='relative flex-1'>
            {file.type.startsWith('image/') ? (
              <div className='relative'>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={URL.createObjectURL(file)}
                  alt={file.name}
                  className='h-16 w-16 rounded object-cover'
                />
                <button
                  type='button'
                  onClick={() => onRemove(index)}
                  className='absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs text-white'
                >
                  <X className='h-3 w-3' />
                </button>
              </div>
            ) : (
              <div className='flex items-center gap-2 rounded bg-gray-100 p-2 text-xs'>
                <Paperclip className='h-3 w-3' />
                <span className='max-w-20 truncate'>{file.name}</span>
                <button type='button' onClick={() => onRemove(index)} className='ml-1 text-red-500'>
                  <X className='h-3 w-3' />
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
