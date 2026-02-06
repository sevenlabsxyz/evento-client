'use client';

'use client';

import { DetachedSheet } from '@/components/ui/detached-sheet';
import { VisuallyHidden } from '@silk-hq/components';
import { useEffect, useState } from 'react';
import './description-sheet.css';
import { LinkProps } from './tiptap-utils';

interface LinkEditSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onSetLink: (props: LinkProps) => void;
  initialUrl?: string;
  initialText?: string;
  initialOpenInNewTab?: boolean;
}

export function LinkEditSheet({
  isOpen,
  onClose,
  onSetLink,
  initialUrl = '',
  initialText = '',
  initialOpenInNewTab = false,
}: LinkEditSheetProps) {
  const [field, setField] = useState<LinkProps>({
    url: initialUrl,
    text: initialText,
    openInNewTab: initialOpenInNewTab,
  });
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      setField({
        url: initialUrl,
        text: initialText,
        openInNewTab: initialOpenInNewTab,
      });
      setError('');
    }
  }, [isOpen, initialUrl, initialText, initialOpenInNewTab]);

  const validateUrl = (inputUrl: string) => {
    if (!inputUrl.trim()) return false;
    try {
      // Add protocol if missing
      const urlToValidate = inputUrl.includes('://') ? inputUrl : `https://${inputUrl}`;
      new URL(urlToValidate);
      return true;
    } catch {
      return false;
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!field.url.trim()) {
      setError('Please enter a URL');
      return;
    }

    if (!validateUrl(field.url)) {
      setError('Please enter a valid URL');
      return;
    }

    // Add protocol if missing
    const finalUrl = field.url.includes('://') ? field.url : `https://${field.url}`;

    onSetLink({
      url: finalUrl,
      text: field.text || finalUrl,
      openInNewTab: field.openInNewTab,
    });
    onClose();
  };

  return (
    <DetachedSheet.Root
      presented={isOpen}
      onPresentedChange={(presented) => !presented && onClose()}
      forComponent='closest'
    >
      <DetachedSheet.Portal>
        <DetachedSheet.View>
          <DetachedSheet.Backdrop />
          <DetachedSheet.Content className='LinkEditSheet-content'>
            <div className='mb-4 flex justify-center'>
              <DetachedSheet.Handle className='LinkEditSheet-handle' />
            </div>
            <VisuallyHidden.Root asChild>
              <DetachedSheet.Title>Edit Link</DetachedSheet.Title>
            </VisuallyHidden.Root>

            <form onSubmit={handleSubmit} className='LinkEditSheet-container'>
              <h3 className='LinkEditSheet-title'>Edit Link</h3>

              <div className='LinkEditSheet-form'>
                <div className='LinkEditSheet-field'>
                  <label className='LinkEditSheet-label'>Link</label>
                  <input
                    type='url'
                    value={field.url}
                    onChange={(e) => {
                      setField({ ...field, url: e.target.value });
                      setError('');
                    }}
                    placeholder='Paste a link (https://...)'
                    className='LinkEditSheet-input'
                    autoFocus
                    required
                  />
                  {error && <p className='LinkEditSheet-error'>{error}</p>}
                </div>

                <div className='LinkEditSheet-field'>
                  <label className='LinkEditSheet-label'>Display text (optional)</label>
                  <input
                    type='text'
                    value={field.text}
                    onChange={(e) => setField({ ...field, text: e.target.value })}
                    placeholder='Text to display'
                    className='LinkEditSheet-input'
                  />
                </div>

                <div className='LinkEditSheet-field LinkEditSheet-field--checkbox'>
                  <label className='LinkEditSheet-checkboxLabel'>
                    <input
                      type='checkbox'
                      checked={field.openInNewTab}
                      onChange={() =>
                        setField({
                          ...field,
                          openInNewTab: !field.openInNewTab,
                        })
                      }
                      className='LinkEditSheet-checkbox'
                    />
                    <span>Open in new tab</span>
                  </label>
                </div>
              </div>

              <div className='LinkEditSheet-buttons'>
                <button
                  type='button'
                  onClick={onClose}
                  className='LinkEditSheet-button LinkEditSheet-button--cancel'
                >
                  Cancel
                </button>
                <button type='submit' className='LinkEditSheet-button LinkEditSheet-button--save'>
                  Insert
                </button>
              </div>
            </form>
          </DetachedSheet.Content>
        </DetachedSheet.View>
      </DetachedSheet.Portal>
    </DetachedSheet.Root>
  );
}
