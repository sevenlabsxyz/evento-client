import type { Editor } from '@tiptap/core'
import { cn } from '@/lib/utils'
import { Bold, Italic, MoreHorizontal, Strikethrough, Code } from 'lucide-react'
import { ToolbarButton } from '../toolbar-button'
import { ShortcutKey } from '../shortcut-key'
import { activeItemClass, DropdownMenuItemClass } from '../tiptap-utils'
import { useState } from 'react'
import { DetachedSheet } from '@/components/ui/detached-sheet'
import { VisuallyHidden } from '@silk-hq/components'

interface SectionTwoProps {
  editor: Editor;
  onOpenSheet?: (sheet: string) => void;
}

export default function SectionTwo({ editor, onOpenSheet }: SectionTwoProps) {
  const [showDropdown, setShowDropdown] = useState(false)

  const toggleStrike = () => {
    editor.chain().focus().toggleStrike().run()
    setShowDropdown(false)
  }

  const toggleCode = () => {
    editor.chain().focus().toggleCode().run()
    setShowDropdown(false)
  }

  const clearFormatting = () => {
    editor.chain().focus().unsetAllMarks().run()
    setShowDropdown(false)
  }

  return (
    <>
      {/* BOLD */}
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleBold().run()}
        disabled={!editor.can().chain().focus().toggleBold().run() || editor.isActive('codeBlock')}
        isActive={editor.isActive('bold')}
        tooltip="Bold"
        aria-label="Bold"
      >
        <Bold className="h-5 w-5" />
      </ToolbarButton>

      {/* ITALIC */}
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleItalic().run()}
        disabled={!editor.can().chain().focus().toggleItalic().run() || editor.isActive('codeBlock')}
        isActive={editor.isActive('italic')}
        tooltip="Italic"
        aria-label="Italic"
      >
        <Italic className="h-5 w-5" />
      </ToolbarButton>

      {/* MORE FORMATTING */}
      <ToolbarButton
        isActive={editor.isActive('strike') || editor.isActive('code')}
        tooltip="More formatting"
        aria-label="More formatting"
        onClick={() => {
          if (onOpenSheet && typeof window !== 'undefined' && window.innerWidth < 768) {
            onOpenSheet('moreFormatting');
          } else {
            setShowDropdown(!showDropdown);
          }
        }}
      >
        <MoreHorizontal className="h-5 w-5" />
      </ToolbarButton>

      {showDropdown && (
        <>
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setShowDropdown(false)}
          />
          <div className="absolute top-full left-0 mt-1 z-50 w-64 rounded-md border bg-white shadow-lg">
            <button
              onClick={toggleStrike}
              disabled={!editor.can().chain().focus().toggleStrike().run() || editor.isActive('codeBlock')}
              className={cn(DropdownMenuItemClass, { [activeItemClass]: editor.isActive('strike') })}
              aria-label="Strikethrough"
            >
              <span className="grow">Strikethrough</span>
              <ShortcutKey keys={['mod', 'shift', 'S']} />
            </button>
            <button
              onClick={toggleCode}
              disabled={!editor.can().chain().focus().toggleCode().run() || editor.isActive('codeBlock')}
              className={cn(DropdownMenuItemClass, { [activeItemClass]: editor.isActive('code') })}
              aria-label="Code"
            >
              <span className="grow">Code</span>
              <ShortcutKey keys={['mod', 'E']} />
            </button>
            <button
              onClick={clearFormatting}
              disabled={!editor.can().chain().focus().unsetAllMarks().run() || editor.isActive('codeBlock')}
              className={cn(DropdownMenuItemClass)}
              aria-label="Clear formatting"
            >
              <span className="grow">Clear formatting</span>
            </button>
          </div>
        </>
      )}
    </>
  )
}