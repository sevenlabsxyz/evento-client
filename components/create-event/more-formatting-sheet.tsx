import { MasterScrollableSheet } from '@/components/ui/master-scrollable-sheet';
import { cn } from '@/lib/utils';
import type { Editor } from '@tiptap/core';
import { Code, Strikethrough } from 'lucide-react';

interface MoreFormattingSheetProps {
  isOpen: boolean;
  onClose: () => void;
  editor: Editor;
}

export default function MoreFormattingSheet({ isOpen, onClose, editor }: MoreFormattingSheetProps) {
  return (
    <MasterScrollableSheet
      title='More Formatting'
      open={isOpen}
      onOpenChange={(open) => !open && onClose()}
      contentClassName='FormattingSheet-content'
    >
      <h3 className='FormattingSheet-title'>More Formatting</h3>

      <div className='FormattingSheet-options'>
        <button
          onClick={() => {
            editor.chain().focus().toggleStrike().run();
            onClose();
          }}
          disabled={
            !editor.can().chain().focus().toggleStrike().run() || editor.isActive('codeBlock')
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
            !editor.can().chain().focus().unsetAllMarks().run() || editor.isActive('codeBlock')
          }
          className={cn('FormattingSheet-option')}
          aria-label='Clear formatting'
        >
          <span className='grow'>Clear formatting</span>
        </button>
      </div>
    </MasterScrollableSheet>
  );
}
