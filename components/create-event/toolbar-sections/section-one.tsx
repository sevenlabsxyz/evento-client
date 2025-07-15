import type { Editor } from '@tiptap/core'
import type { Level } from '@tiptap/extension-heading'
import { cn } from '@/lib/utils'
import { Type, ChevronDown } from 'lucide-react'
import { ToolbarButton } from '../toolbar-button'
import { ShortcutKey } from '../shortcut-key'
import { activeItemClass, DropdownMenuItemClass } from '../tiptap-utils'
import { useState } from 'react'
import { DetachedSheet } from '@/components/ui/detached-sheet'
import { VisuallyHidden } from '@silk-hq/components'

interface SectionOneProps {
  editor: Editor;
  onOpenSheet?: (sheet: string) => void;
}

export default function SectionOne({ editor, onOpenSheet }: SectionOneProps) {
  const [showDropdown, setShowDropdown] = useState(false)

  const toggleHeading = (level: Level) => {
    editor.chain().focus().toggleHeading({ level }).run()
    setShowDropdown(false)
  }

  const setParagraph = () => {
    editor.chain().focus().setParagraph().run()
    setShowDropdown(false)
  }

  // Desktop dropdown version
  return (
    <div className="relative">
      <ToolbarButton
        isActive={editor.isActive('heading')}
        tooltip="Text styles"
        className="w-12"
        disabled={editor.isActive('codeBlock')}
        onClick={() => {
          if (onOpenSheet && typeof window !== 'undefined' && window.innerWidth < 768) {
            onOpenSheet('textStyles');
          } else {
            setShowDropdown(!showDropdown);
          }
        }}
      >
        <Type className="h-5 w-5" />
        <ChevronDown className="h-5 w-5" />
      </ToolbarButton>
      
      {showDropdown && (
        <>
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setShowDropdown(false)}
          />
          <div className="absolute top-full left-0 mt-1 z-50 w-64 rounded-md border bg-white shadow-lg">
            <button
              onClick={setParagraph}
              className={cn(DropdownMenuItemClass, {
                [activeItemClass]: editor.isActive('paragraph')
              })}
              aria-label="Normal text"
            >
              <span className="grow">Normal Text</span>
              <ShortcutKey keys={['mod', 'alt', '0']} />
            </button>
            <button
              onClick={() => toggleHeading(1)}
              className={cn(DropdownMenuItemClass, "flex items-center", {
                [activeItemClass]: editor.isActive('heading', { level: 1 })
              })}
              aria-label="Heading 1"
            >
              <h1 className="m-0 grow text-3xl font-extrabold">Heading 1</h1>
              <ShortcutKey keys={['mod', 'alt', '1']} />
            </button>
            <button
              onClick={() => toggleHeading(2)}
              className={cn(DropdownMenuItemClass, "flex items-center", {
                [activeItemClass]: editor.isActive('heading', { level: 2 })
              })}
              aria-label="Heading 2"
            >
              <h2 className="m-0 grow text-xl font-bold">Heading 2</h2>
              <ShortcutKey keys={['mod', 'alt', '2']} />
            </button>
            <button
              onClick={() => toggleHeading(3)}
              className={cn(DropdownMenuItemClass, "flex items-center", {
                [activeItemClass]: editor.isActive('heading', { level: 3 })
              })}
              aria-label="Heading 3"
            >
              <h3 className="m-0 grow text-lg font-semibold">Heading 3</h3>
              <ShortcutKey keys={['mod', 'alt', '3']} />
            </button>
          </div>
        </>
      )}
    </div>
  )
}