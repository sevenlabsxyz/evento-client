import { DetachedSheet } from '@/components/ui/detached-sheet';
import { cn } from '@/lib/utils';
import { VisuallyHidden } from '@silk-hq/components';
import type { Editor } from '@tiptap/core';
import { List } from 'lucide-react';
import { useTranslations } from 'next-intl';

interface ListsSheetProps {
  isOpen: boolean;
  onClose: () => void;
  editor: Editor;
}

export default function ListsSheet({ isOpen, onClose, editor }: ListsSheetProps) {
  const t = useTranslations('createEvent');
  return (
    <DetachedSheet.Root
      presented={isOpen}
      onPresentedChange={(presented) => !presented && onClose()}
      forComponent='closest'
    >
      <DetachedSheet.Portal>
        <DetachedSheet.View>
          <DetachedSheet.Backdrop />
          <DetachedSheet.Content className='ListSheet-content'>
            <div className='mb-4 flex justify-center'>
              <DetachedSheet.Handle className='ListSheet-handle' />
            </div>
            <VisuallyHidden.Root asChild>
              <DetachedSheet.Title>{t('toolbar.lists')}</DetachedSheet.Title>
            </VisuallyHidden.Root>

            <div className='ListSheet-container'>
              <h3 className='ListSheet-title'>{t('toolbar.lists')}</h3>

              <div className='ListSheet-options'>
                <button
                  onClick={() => {
                    editor.chain().focus().toggleBulletList().run();
                    onClose();
                  }}
                  className={cn('ListSheet-option', {
                    'ListSheet-option--active': editor.isActive('bulletList'),
                  })}
                  aria-label={t('toolbar.bulletList')}
                >
                  <List className='mr-2 h-4 w-4' />
                  <span className='grow'>{t('toolbar.bulletList')}</span>
                </button>
              </div>
            </div>
          </DetachedSheet.Content>
        </DetachedSheet.View>
      </DetachedSheet.Portal>
    </DetachedSheet.Root>
  );
}
