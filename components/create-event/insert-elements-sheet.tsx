import type { Editor } from '@tiptap/core';
import { Minus } from 'lucide-react';
import { DetachedSheet } from '@/components/ui/detached-sheet';
import { VisuallyHidden } from '@silk-hq/components';

interface InsertElementsSheetProps {
  isOpen: boolean;
  onClose: () => void;
  editor: Editor;
}

export default function InsertElementsSheet({
  isOpen,
  onClose,
  editor,
}: InsertElementsSheetProps) {
  return (
    <DetachedSheet.Root
      presented={isOpen}
      onPresentedChange={(presented) => !presented && onClose()}
      forComponent="closest"
    >
      <DetachedSheet.Portal>
        <DetachedSheet.View>
          <DetachedSheet.Backdrop />
          <DetachedSheet.Content className="InsertSheet-content">
            <div className="flex justify-center mb-4">
              <DetachedSheet.Handle className="InsertSheet-handle" />
            </div>
            <VisuallyHidden.Root asChild>
              <DetachedSheet.Title>Insert Elements</DetachedSheet.Title>
            </VisuallyHidden.Root>

            <div className="InsertSheet-container">
              <h3 className="InsertSheet-title">Insert Elements</h3>

              <div className="InsertSheet-options">
                <button
                  onClick={() => {
                    editor.chain().focus().setHorizontalRule().run();
                    onClose();
                  }}
                  className="InsertSheet-option"
                >
                  <Minus className="h-4 w-4 mr-2" />
                  <span className="grow">Divider</span>
                </button>
              </div>
            </div>
          </DetachedSheet.Content>
        </DetachedSheet.View>
      </DetachedSheet.Portal>
    </DetachedSheet.Root>
  );
}
