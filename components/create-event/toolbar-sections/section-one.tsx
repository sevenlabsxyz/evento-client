import { cn } from '@/lib/utils';
import type { Editor } from '@tiptap/core';
import type { Level } from '@tiptap/extension-heading';
import { ChevronDown, Type } from 'lucide-react';
import { useState } from 'react';
import { ShortcutKey } from '../shortcut-key';
import { DropdownMenuItemClass, activeItemClass } from '../tiptap-utils';
import { ToolbarButton } from '../toolbar-button';

interface SectionOneProps {
  editor: Editor;
  onOpenSheet?: (sheet: string) => void;
}

export default function SectionOne({ editor, onOpenSheet }: SectionOneProps) {
  const [showDropdown, setShowDropdown] = useState(false);

  const toggleHeading = (level: Level) => {
    editor.chain().focus().toggleHeading({ level }).run();
    setShowDropdown(false);
  };

  const setParagraph = () => {
    editor.chain().focus().setParagraph().run();
    setShowDropdown(false);
  };

  // Desktop dropdown version
  return (
    <div className='relative'>
      <ToolbarButton
        isActive={editor.isActive('heading')}
        tooltip='Text styles'
        className='w-12'
        disabled={editor.isActive('codeBlock')}
        onClick={() => {
          if (onOpenSheet && typeof window !== 'undefined' && window.innerWidth < 768) {
            onOpenSheet('textStyles');
          } else {
            setShowDropdown(!showDropdown);
          }
        }}
      >
        <Type className='h-5 w-5' />
        <ChevronDown className='h-5 w-5' />
      </ToolbarButton>

      {showDropdown && (
        <>
          <div className='fixed inset-0 z-40' onClick={() => setShowDropdown(false)} />
          <div className='absolute left-0 top-full z-50 mt-1 w-64 rounded-md border bg-white shadow-lg'>
            <button
              onClick={setParagraph}
              className={cn(DropdownMenuItemClass, {
                [activeItemClass]: editor.isActive('paragraph'),
              })}
              aria-label='Normal text'
            >
              <span className='grow'>Normal Text</span>
              <ShortcutKey keys={['mod', 'alt', '0']} />
            </button>
            <button
              onClick={() => toggleHeading(1)}
              className={cn(DropdownMenuItemClass, 'flex items-center', {
                [activeItemClass]: editor.isActive('heading', { level: 1 }),
              })}
              aria-label='Heading 1'
            >
              <h1 className='m-0 grow text-3xl font-extrabold'>Heading 1</h1>
              <ShortcutKey keys={['mod', 'alt', '1']} />
            </button>
            <button
              onClick={() => toggleHeading(2)}
              className={cn(DropdownMenuItemClass, 'flex items-center', {
                [activeItemClass]: editor.isActive('heading', { level: 2 }),
              })}
              aria-label='Heading 2'
            >
              <h2 className='m-0 grow text-xl font-bold'>Heading 2</h2>
              <ShortcutKey keys={['mod', 'alt', '2']} />
            </button>
            <button
              onClick={() => toggleHeading(3)}
              className={cn(DropdownMenuItemClass, 'flex items-center', {
                [activeItemClass]: editor.isActive('heading', { level: 3 }),
              })}
              aria-label='Heading 3'
            >
              <h3 className='m-0 grow text-lg font-semibold'>Heading 3</h3>
              <ShortcutKey keys={['mod', 'alt', '3']} />
            </button>
          </div>
        </>
      )}
    </div>
  );
}
