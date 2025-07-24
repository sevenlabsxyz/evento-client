import { DetachedSheet } from '@/components/ui/detached-sheet';
import { cn } from '@/lib/utils';
import { VisuallyHidden } from '@silk-hq/components';
import type { Editor } from '@tiptap/core';
import { Code, Strikethrough } from 'lucide-react';

interface MoreFormattingSheetProps {
  isOpen: boolean;
  onClose: () => void;
  editor: Editor;
}

export default function MoreFormattingSheet({ isOpen, onClose, editor }: MoreFormattingSheetProps) {
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
              <DetachedSheet.Title>More Formatting</DetachedSheet.Title>
            </VisuallyHidden.Root>

            <div className='FormattingSheet-container'>
              <h3 className='FormattingSheet-title'>More Formatting</h3>

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
                  aria-label='Strikethrough'
                >
                  <Strikethrough className='mr-2 h-4 w-4' />
                  <span className='grow'>Strikethrough</span>
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
                  aria-label='Code'
                >
                  <Code className='mr-2 h-4 w-4' />
                  <span className='grow'>Code</span>
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
                  aria-label='Clear formatting'
                >
                  <span className='grow'>Clear formatting</span>
                </button>
              </div>
            </div>
          </DetachedSheet.Content>
        </DetachedSheet.View>
      </DetachedSheet.Portal>
    </DetachedSheet.Root>
  );
}
