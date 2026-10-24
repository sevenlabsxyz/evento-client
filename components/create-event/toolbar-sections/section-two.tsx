import { cn } from '@/lib/utils';
import type { Editor } from '@tiptap/core';
import { Bold, Italic, MoreHorizontal } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { ShortcutKey } from '../shortcut-key';
import { DropdownMenuItemClass, activeItemClass } from '../tiptap-utils';
import { ToolbarButton } from '../toolbar-button';

interface SectionTwoProps {
  editor: Editor;
  onOpenSheet?: (sheet: string) => void;
}

export default function SectionTwo({ editor, onOpenSheet }: SectionTwoProps) {
  const t = useTranslations('createEvent');
  const [showDropdown, setShowDropdown] = useState(false);

  const toggleStrike = () => {
    editor.chain().focus().toggleStrike().run();
    setShowDropdown(false);
  };

  const toggleCode = () => {
    editor.chain().focus().toggleCode().run();
    setShowDropdown(false);
  };

  const clearFormatting = () => {
    editor.chain().focus().unsetAllMarks().run();
    setShowDropdown(false);
  };

  return (
    <>
      {/* BOLD */}
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleBold().run()}
        disabled={!editor.can().chain().focus().toggleBold().run() || editor.isActive('codeBlock')}
        isActive={editor.isActive('bold')}
        tooltip={t('toolbar.bold')}
        aria-label={t('toolbar.bold')}
      >
        <Bold className='h-5 w-5' />
      </ToolbarButton>

      {/* ITALIC */}
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleItalic().run()}
        disabled={
          !editor.can().chain().focus().toggleItalic().run() || editor.isActive('codeBlock')
        }
        isActive={editor.isActive('italic')}
        tooltip={t('toolbar.italic')}
        aria-label={t('toolbar.italic')}
      >
        <Italic className='h-5 w-5' />
      </ToolbarButton>

      {/* MORE FORMATTING */}
      <ToolbarButton
        isActive={editor.isActive('strike') || editor.isActive('code')}
        tooltip={t('toolbar.moreFormatting')}
        aria-label={t('toolbar.moreFormatting')}
        onClick={() => {
          if (onOpenSheet && typeof window !== 'undefined' && window.innerWidth < 768) {
            onOpenSheet('moreFormatting');
          } else {
            setShowDropdown(!showDropdown);
          }
        }}
      >
        <MoreHorizontal className='h-5 w-5' />
      </ToolbarButton>

      {showDropdown && (
        <>
          <div className='fixed inset-0 z-40' onClick={() => setShowDropdown(false)} />
          <div className='absolute left-0 top-full z-50 mt-1 w-64 rounded-md border bg-white shadow-lg dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-200 dark:shadow-black/40'>
            <button
              onClick={toggleStrike}
              disabled={
                !editor.can().chain().focus().toggleStrike().run() || editor.isActive('codeBlock')
              }
              className={cn(
                DropdownMenuItemClass,
                'dark:disabled:text-neutral-500 dark:disabled:hover:bg-transparent',
                {
                  [activeItemClass]: editor.isActive('strike'),
                }
              )}
              aria-label={t('toolbar.strikethrough')}
            >
              <span className='grow'>{t('toolbar.strikethrough')}</span>
              <ShortcutKey keys={['mod', 'shift', 'S']} />
            </button>
            <button
              onClick={toggleCode}
              disabled={
                !editor.can().chain().focus().toggleCode().run() || editor.isActive('codeBlock')
              }
              className={cn(
                DropdownMenuItemClass,
                'dark:disabled:text-neutral-500 dark:disabled:hover:bg-transparent',
                {
                  [activeItemClass]: editor.isActive('code'),
                }
              )}
              aria-label={t('toolbar.code')}
            >
              <span className='grow'>{t('toolbar.code')}</span>
              <ShortcutKey keys={['mod', 'E']} />
            </button>
            <button
              onClick={clearFormatting}
              disabled={
                !editor.can().chain().focus().unsetAllMarks().run() || editor.isActive('codeBlock')
              }
              className={cn(
                DropdownMenuItemClass,
                'dark:disabled:text-neutral-500 dark:disabled:hover:bg-transparent'
              )}
              aria-label={t('toolbar.clearFormatting')}
            >
              <span className='grow'>{t('toolbar.clearFormatting')}</span>
            </button>
          </div>
        </>
      )}
    </>
  );
}
