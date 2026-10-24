import { DetachedSheet } from '@/components/ui/detached-sheet';
import { cn } from '@/lib/utils';
import { VisuallyHidden } from '@silk-hq/components';
import type { Editor } from '@tiptap/core';
import { Code, Strikethrough } from 'lucide-react';
import { useTranslations } from 'next-intl';

interface MoreFormattingSheetProps {
  isOpen: boolean;
  onClose: () => void;
  editor: Editor;
}

export default function MoreFormattingSheet({ isOpen, onClose, editor }: MoreFormattingSheetProps) {
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
          <DetachedSheet.Content className='FormattingSheet-content'>
            <DetachedSheet.Handle className='FormattingSheet-handle' />
            <VisuallyHidden.Root asChild>
              <DetachedSheet.Title>{t('sheets.moreFormatting')}</DetachedSheet.Title>
            </VisuallyHidden.Root>

            <div className='FormattingSheet-container'>
              <h3 className='FormattingSheet-title'>{t('sheets.moreFormatting')}</h3>

              <div className='FormattingSheet-options'>
                <button
                  onClick={() => {
                    editor.chain().focus().toggleStrike().run();
                    onClose();
                  }}
                  disabled={
                    !editor.can().chain().focus().toggleStrike().run() ||
                    editor.isActive('codeBlock')
                  }
                  className={cn('FormattingSheet-option', {
                    'FormattingSheet-option--active': editor.isActive('strike'),
                  })}
                  aria-label={t('toolbar.strikethrough')}
                >
                  <Strikethrough className='mr-2 h-4 w-4' />
                  <span className='grow'>{t('toolbar.strikethrough')}</span>
                </button>
                <button
                  onClick={() => {
                    editor.chain().focus().toggleCode().run();
                    onClose();
                  }}
                  disabled={
                    !editor.can().chain().focus().toggleCode().run() || editor.isActive('codeBlock')
                  }
                  className={cn('FormattingSheet-option', {
                    'FormattingSheet-option--active': editor.isActive('code'),
                  })}
                  aria-label={t('toolbar.code')}
                >
                  <Code className='mr-2 h-4 w-4' />
                  <span className='grow'>{t('toolbar.code')}</span>
                </button>
                <button
                  onClick={() => {
                    editor.chain().focus().unsetAllMarks().run();
                    onClose();
                  }}
                  disabled={
                    !editor.can().chain().focus().unsetAllMarks().run() ||
                    editor.isActive('codeBlock')
                  }
                  className={cn('FormattingSheet-option')}
                  aria-label={t('toolbar.clearFormatting')}
                >
                  <span className='grow'>{t('toolbar.clearFormatting')}</span>
                </button>
              </div>
            </div>
          </DetachedSheet.Content>
        </DetachedSheet.View>
      </DetachedSheet.Portal>
    </DetachedSheet.Root>
  );
}
