import { MasterScrollableSheet } from '@/components/ui/master-scrollable-sheet';
import type { Editor } from '@tiptap/core';
import { Minus } from 'lucide-react';

interface InsertElementsSheetProps {
  isOpen: boolean;
  onClose: () => void;
  editor: Editor;
}

export default function InsertElementsSheet({ isOpen, onClose, editor }: InsertElementsSheetProps) {
  return (
    <MasterScrollableSheet
      title='Insert Elements'
      open={isOpen}
      onOpenChange={(open) => !open && onClose()}
      contentClassName='InsertSheet-content'
    >
      <h3 className='InsertSheet-title'>Insert Elements</h3>

      <div className='InsertSheet-options'>
        <button
          onClick={() => {
            editor.chain().focus().setHorizontalRule().run();
            onClose();
          }}
          className='InsertSheet-option'
        >
          <Minus className='mr-2 h-4 w-4' />
          <span className='grow'>Divider</span>
        </button>
      </div>
    </MasterScrollableSheet>
  );
}
