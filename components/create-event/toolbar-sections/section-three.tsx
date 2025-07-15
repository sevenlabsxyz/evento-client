import type { Editor } from '@tiptap/core'
import { cn } from '@/lib/utils'
import { List, ChevronDown } from 'lucide-react'
import { ToolbarButton } from '../toolbar-button'
import { activeItemClass, DropdownMenuItemClass } from '../tiptap-utils'
import { ShortcutKey } from '../shortcut-key'
import { useState } from 'react'
import { DetachedSheet } from '@/components/ui/detached-sheet'
import { VisuallyHidden } from '@silk-hq/components'

interface SectionThreeProps {
  editor: Editor;
  onOpenSheet?: (sheet: string) => void;
}

export default function SectionThree({ editor, onOpenSheet }: SectionThreeProps) {
  const [showDropdown, setShowDropdown] = useState(false)

  const toggleBulletList = () => {
    editor.chain().focus().toggleBulletList().run()
    setShowDropdown(false)
  }

  // Desktop dropdown version
  return (
    <div className="relative">
      <ToolbarButton
        isActive={editor.isActive('bulletList') || editor.isActive('orderedList')}
        tooltip="Lists"
        className="w-12"
        onClick={() => {
          if (onOpenSheet && typeof window !== 'undefined' && window.innerWidth < 768) {
            onOpenSheet('lists');
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
          <div className="absolute top-full left-0 mt-1 z-50 w-64 rounded-md border bg-white shadow-lg">
            <button
              onClick={toggleBulletList}
              className={cn(DropdownMenuItemClass, { [activeItemClass]: editor.isActive('bulletList') })}
              aria-label="Bullet list"
            >
              <span className="grow">Bullet list</span>
              <ShortcutKey keys={['mod', 'shift', '8']} />
            </button>
          </div>
        </>
      )}
    </div>
  )
}