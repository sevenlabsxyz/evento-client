import { cn } from "@/lib/utils";
import type { Editor } from "@tiptap/core";
import { ChevronDown, List } from "lucide-react";
import { useState } from "react";
import { ShortcutKey } from "../shortcut-key";
import { DropdownMenuItemClass, activeItemClass } from "../tiptap-utils";
import { ToolbarButton } from "../toolbar-button";

interface SectionThreeProps {
  editor: Editor;
  onOpenSheet?: (sheet: string) => void;
}

export default function SectionThree({
  editor,
  onOpenSheet,
}: SectionThreeProps) {
  const [showDropdown, setShowDropdown] = useState(false);

  const toggleBulletList = () => {
    editor.chain().focus().toggleBulletList().run();
    setShowDropdown(false);
  };

  // Desktop dropdown version
  return (
    <div className="relative">
      <ToolbarButton
        isActive={
          editor.isActive("bulletList") || editor.isActive("orderedList")
        }
        tooltip="Lists"
        className="w-12"
        onClick={() => {
          if (
            onOpenSheet &&
            typeof window !== "undefined" &&
            window.innerWidth < 768
          ) {
            onOpenSheet("lists");
          } else {
            setShowDropdown(!showDropdown);
          }
        }}
      >
        <List className="h-5 w-5" />
        <ChevronDown className="h-5 w-5" />
      </ToolbarButton>

      {showDropdown && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setShowDropdown(false)}
          />
          <div className="absolute left-0 top-full z-50 mt-1 w-64 rounded-md border bg-white shadow-lg">
            <button
              onClick={toggleBulletList}
              className={cn(DropdownMenuItemClass, {
                [activeItemClass]: editor.isActive("bulletList"),
              })}
              aria-label="Bullet list"
            >
              <span className="grow">Bullet list</span>
              <ShortcutKey keys={["mod", "shift", "8"]} />
            </button>
          </div>
        </>
      )}
    </div>
  );
}
