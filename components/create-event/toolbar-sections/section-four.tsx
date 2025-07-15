import type { Editor } from "@tiptap/core";
import { cn } from '@/lib/utils'
import { Link, Plus, ChevronDown, Minus } from 'lucide-react'
import { ToolbarButton } from '../toolbar-button'
import { activeItemClass, DropdownMenuItemClass } from '../tiptap-utils'
import { LinkEditSheet } from '../link-edit-sheet'
import { LinkProps } from '../tiptap-utils'
import { useState } from 'react'
import { DetachedSheet } from '@/components/ui/detached-sheet'
import { VisuallyHidden } from '@silk-hq/components'

interface SectionFourProps {
  editor: Editor;
  onOpenSheet?: (sheet: string) => void;
  onOpenLinkEditSheet?: (editor: Editor, linkData: { url: string; text: string; openInNewTab: boolean }) => void;
}

export default function SectionFour({ editor, onOpenSheet, onOpenLinkEditSheet }: SectionFourProps) {
  const [showLinkSheet, setShowLinkSheet] = useState(false)
  const [showInsertDropdown, setShowInsertDropdown] = useState(false)

  const setLink = ({ url, text, openInNewTab }: LinkProps) => {
    const { from, to } = editor.state.selection
    const selectedText = editor.state.doc.textBetween(from, to)
    
    if (selectedText) {
      // If there's selected text, apply link to it
      editor
        .chain()
        .focus()
        .extendMarkRange('link')
        .setLink({ href: url, target: openInNewTab ? '_blank' : '' })
        .run()
    } else {
      // If no text selected, insert text with link
      editor
        .chain()
        .focus()
        .insertContent({
          type: 'text',
          text: text || url,
          marks: [
            {
              type: 'link',
              attrs: {
                href: url,
                target: openInNewTab ? '_blank' : ''
              }
            }
          ]
        })
        .run()
    }
    
    setShowLinkSheet(false)
  }

  const insertDivider = () => {
    editor.chain().focus().setHorizontalRule().run()
    setShowInsertDropdown(false)
  }

  return (
    <>
      {/* LINK */}
      <ToolbarButton 
        isActive={editor.isActive('link')} 
        tooltip="Link" 
        disabled={editor.isActive('codeBlock')}
        onClick={() => {
          if (onOpenLinkEditSheet) {
            const linkData = {
              url: editor.getAttributes('link').href || '',
              text: editor.state.doc.textBetween(
                editor.state.selection.from,
                editor.state.selection.to
              ),
              openInNewTab: editor.getAttributes('link').target === '_blank'
            };
            onOpenLinkEditSheet(editor, linkData);
          } else {
            setShowLinkSheet(true);
          }
        }}
      >
        <Link className="h-5 w-5" />
      </ToolbarButton>

      {/* INSERT ELEMENTS */}
      <div className="relative">
        <ToolbarButton
          isActive={
            editor.isActive("codeBlock") || editor.isActive("blockquote")
          }
          tooltip="Insert elements"
          className="w-12 hidden md:flex"
          onClick={() => {
            if (onOpenSheet && typeof window !== 'undefined' && window.innerWidth < 768) {
              onOpenSheet('insertElements');
            } else {
              setShowInsertDropdown(!showInsertDropdown);
            }
          }}
        >
          <Plus className="h-5 w-5" />
          <ChevronDown className="h-5 w-5" />
        </ToolbarButton>
        
        {showInsertDropdown && (
          <>
            <div 
              className="fixed inset-0 z-40" 
              onClick={() => setShowInsertDropdown(false)}
            />
            <div className="absolute top-full left-0 mt-1 z-50 w-64 rounded-md border bg-white shadow-lg">
              <button
                onClick={insertDivider}
                className={cn(DropdownMenuItemClass)}
              >
                <span className="flex grow items-center">
                  <Minus className="mr-2 h-4 w-4" />
                  Divider
                </span>
              </button>
            </div>
          </>
        )}
      </div>

      {/* Link Edit Sheet - only show if no callback provided (fallback) */}
      {!onOpenLinkEditSheet && (
        <LinkEditSheet
          isOpen={showLinkSheet}
          onClose={() => setShowLinkSheet(false)}
          onSetLink={setLink}
          initialUrl={editor.getAttributes('link').href || ''}
          initialText={editor.state.doc.textBetween(
            editor.state.selection.from,
            editor.state.selection.to
          )}
          initialOpenInNewTab={editor.getAttributes('link').target === '_blank'}
        />
      )}
    </>
  )
}