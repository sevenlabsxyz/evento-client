import type { Editor } from '@tiptap/core'
import { cn } from '@/lib/utils'
import { List } from 'lucide-react'
import { DetachedSheet } from '@/components/ui/detached-sheet'
import { VisuallyHidden } from '@silk-hq/components'

interface ListsSheetProps {
  isOpen: boolean;
  onClose: () => void;
  editor: Editor;
}

export default function ListsSheet({ isOpen, onClose, editor }: ListsSheetProps) {
  return (
    <DetachedSheet.Root
      presented={isOpen}
      onPresentedChange={(presented) => !presented && onClose()}
      forComponent="closest"
    >
      <DetachedSheet.Portal>
        <DetachedSheet.View>
          <DetachedSheet.Backdrop />
          <DetachedSheet.Content className="ListSheet-content">
            <DetachedSheet.Handle className="ListSheet-handle" />
            <VisuallyHidden.Root asChild>
              <DetachedSheet.Title>Lists</DetachedSheet.Title>
            </VisuallyHidden.Root>

            <div className="ListSheet-container">
              <h3 className="ListSheet-title">Lists</h3>
              
              <div className="ListSheet-options">
                <button
                  onClick={() => {
                    editor.chain().focus().toggleBulletList().run();
                    onClose();
                  }}
                  className={cn("ListSheet-option", {
                    'ListSheet-option--active': editor.isActive('bulletList')
                  })}
                  aria-label="Bullet list"
                >
                  <List className="h-4 w-4 mr-2" />
                  <span className="grow">Bullet list</span>
                </button>
              </div>
            </div>
          </DetachedSheet.Content>
        </DetachedSheet.View>
      </DetachedSheet.Portal>
    </DetachedSheet.Root>
  )
}