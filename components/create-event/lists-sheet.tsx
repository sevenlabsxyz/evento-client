import { MasterScrollableSheet } from '@/components/ui/master-scrollable-sheet';
import { cn } from '@/lib/utils';
import type { Editor } from '@tiptap/core';
import { List } from 'lucide-react';

interface ListsSheetProps {
  isOpen: boolean;
  onClose: () => void;
  editor: Editor;
}

export default function ListsSheet({ isOpen, onClose, editor }: ListsSheetProps) {
  return (
    <MasterScrollableSheet
      title='Lists'
      open={isOpen}
      onOpenChange={(open) => !open && onClose()}
      contentClassName='ListSheet-content'
    >
      <div className='ListSheet-container'>
        <h3 className='ListSheet-title'>Lists</h3>

        <div className='ListSheet-options'>
          <button
            onClick={() => {
              editor.chain().focus().toggleBulletList().run();
              onClose();
            }}
            className={cn('ListSheet-option', {
              'ListSheet-option--active': editor.isActive('bulletList'),
            })}
            aria-label='Bullet list'
          >
            <List className='mr-2 h-4 w-4' />
            <span className='grow'>Bullet list</span>
          </button>
        </div>
      </div>
    </MasterScrollableSheet>
  );
}
