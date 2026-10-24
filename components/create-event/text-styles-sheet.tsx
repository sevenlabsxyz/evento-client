import { DetachedSheet } from '@/components/ui/detached-sheet';
import { cn } from '@/lib/utils';
import { VisuallyHidden } from '@silk-hq/components';
import type { Editor } from '@tiptap/core';
import { useTranslations } from 'next-intl';

interface TextStylesSheetProps {
  isOpen: boolean;
  onClose: () => void;
  editor: Editor;
}

export default function TextStylesSheet({ isOpen, onClose, editor }: TextStylesSheetProps) {
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
          <DetachedSheet.Content className='TextStylesSheet-content'>
            <DetachedSheet.Handle className='TextStylesSheet-handle' />
            <VisuallyHidden.Root asChild>
              <DetachedSheet.Title>{t('sheets.textStyles')}</DetachedSheet.Title>
            </VisuallyHidden.Root>

            <div className='TextStylesSheet-container'>
              <h3 className='TextStylesSheet-title'>{t('sheets.textStyles')}</h3>

              <div className='TextStylesSheet-options'>
                <button
                  onClick={() => {
                    editor.chain().focus().setParagraph().run();
                    onClose();
                  }}
                  className={cn('TextStylesSheet-option', {
                    'TextStylesSheet-option--active': editor.isActive('paragraph'),
                  })}
                  aria-label={t('toolbar.normalTextAria')}
                >
                  <span className='grow'>{t('toolbar.normalText')}</span>
                </button>
                <button
                  onClick={() => {
                    editor.chain().focus().toggleHeading({ level: 1 }).run();
                    onClose();
                  }}
                  className={cn('TextStylesSheet-option', {
                    'TextStylesSheet-option--active': editor.isActive('heading', { level: 1 }),
                  })}
                  aria-label={t('toolbar.heading1')}
                >
                  <h1 className='m-0 grow text-3xl font-extrabold'>{t('toolbar.heading1')}</h1>
                </button>
                <button
                  onClick={() => {
                    editor.chain().focus().toggleHeading({ level: 2 }).run();
                    onClose();
                  }}
                  className={cn('TextStylesSheet-option', {
                    'TextStylesSheet-option--active': editor.isActive('heading', { level: 2 }),
                  })}
                  aria-label={t('toolbar.heading2')}
                >
                  <h2 className='m-0 grow text-xl font-bold'>{t('toolbar.heading2')}</h2>
                </button>
                <button
                  onClick={() => {
                    editor.chain().focus().toggleHeading({ level: 3 }).run();
                    onClose();
                  }}
                  className={cn('TextStylesSheet-option', {
                    'TextStylesSheet-option--active': editor.isActive('heading', { level: 3 }),
                  })}
                  aria-label={t('toolbar.heading3')}
                >
                  <h3 className='m-0 grow text-lg font-semibold'>{t('toolbar.heading3')}</h3>
                </button>
              </div>
            </div>
          </DetachedSheet.Content>
        </DetachedSheet.View>
      </DetachedSheet.Portal>
    </DetachedSheet.Root>
  );
}
