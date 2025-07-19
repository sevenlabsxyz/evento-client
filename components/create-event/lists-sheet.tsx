import { DetachedSheet } from "@/components/ui/detached-sheet";
import { cn } from "@/lib/utils";
import { VisuallyHidden } from "@silk-hq/components";
import type { Editor } from "@tiptap/core";
import { List } from "lucide-react";

interface ListsSheetProps {
  isOpen: boolean;
  onClose: () => void;
  editor: Editor;
}

export default function ListsSheet({
  isOpen,
  onClose,
  editor,
}: ListsSheetProps) {
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
            <div className="flex justify-center mb-4">
              <DetachedSheet.Handle className="ListSheet-handle" />
            </div>
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
                    "ListSheet-option--active": editor.isActive("bulletList"),
                  })}
                  aria-label="Bullet list"
                >
                  <List className="mr-2 h-4 w-4" />
                  <span className="grow">Bullet list</span>
                </button>
              </div>
            </div>
          </DetachedSheet.Content>
        </DetachedSheet.View>
      </DetachedSheet.Portal>
    </DetachedSheet.Root>
  );
}

