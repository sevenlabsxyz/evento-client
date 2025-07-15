"use client";

import { useState, useEffect } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import type { Editor } from "@tiptap/core";
import StarterKit from "@tiptap/starter-kit";
import Bold from "@tiptap/extension-bold";
import Italic from "@tiptap/extension-italic";
import Heading from "@tiptap/extension-heading";
import Link from "@tiptap/extension-link";
import BulletList from "@tiptap/extension-bullet-list";
import ListItem from "@tiptap/extension-list-item";
import Image from "@tiptap/extension-image";
import Placeholder from "@tiptap/extension-placeholder";
import { Plugin, TextSelection } from "@tiptap/pm/state";
import { getMarkRange } from "@tiptap/core";
import {
  Bold as BoldIcon,
  Italic as ItalicIcon,
  Link as LinkIcon,
  Type,
  X,
} from "lucide-react";
import { SheetWithDetentFull } from "@/components/ui/sheet-with-detent-full";
import { Separator } from "@/components/ui/separator";
import SectionOne from "./toolbar-sections/section-one";
import SectionTwo from "./toolbar-sections/section-two";
import SectionThree from "./toolbar-sections/section-three";
import SectionFour from "./toolbar-sections/section-four";
import { getOutput } from "./tiptap-utils";
import "./description-sheet.css";

interface DescriptionSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (content: string) => void;
  initialContent?: string;
  onOpenTextStylesSheet?: (editor: Editor) => void;
  onOpenMoreFormattingSheet?: (editor: Editor) => void;
  onOpenListsSheet?: (editor: Editor) => void;
  onOpenInsertElementsSheet?: (editor: Editor) => void;
  onOpenLinkEditSheet?: (editor: Editor, linkData: { url: string; text: string; openInNewTab: boolean }) => void;
}

export default function DescriptionSheet({
  isOpen,
  onClose,
  onSave,
  initialContent = "",
  onOpenTextStylesSheet,
  onOpenMoreFormattingSheet,
  onOpenListsSheet,
  onOpenInsertElementsSheet,
  onOpenLinkEditSheet,
}: DescriptionSheetProps) {
  // No longer need activeDetent as it always opens at full height

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        // Disable default extensions we're replacing or customizing
        bold: false,
        italic: false,
        heading: false,
        bulletList: false,
        listItem: false, // Disable default listItem
        link: false, // Disable default link to prevent duplication
      }),
      Bold,
      Italic,
      Heading.configure({
        levels: [1, 2, 3],
      }),
      BulletList.configure({
        HTMLAttributes: {
          class: "list-disc ml-4",
        },
      }),
      ListItem,
      Image,
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: "text-red-600 underline",
        },
      }).extend({
        inclusive: false,
        addProseMirrorPlugins() {
          return [
            new Plugin({
              props: {
                handleClick(view, pos) {
                  const { schema, doc, tr } = view.state;
                  const range = getMarkRange(
                    doc.resolve(pos),
                    schema.marks.link
                  );

                  if (!range) {
                    return;
                  }

                  const { from, to } = range;
                  const start = Math.min(from, to);
                  const end = Math.max(from, to);

                  if (pos < start || pos > end) {
                    return;
                  }

                  const $start = doc.resolve(start);
                  const $end = doc.resolve(end);
                  const transaction = tr.setSelection(
                    new TextSelection($start, $end)
                  );

                  view.dispatch(transaction);
                },
              },
            }),
          ];
        },
      }),
      Placeholder.configure({
        placeholder: "Add a description...",
        emptyEditorClass: "is-editor-empty",
      }),
    ],
    content: initialContent,
    immediatelyRender: false, // Prevent SSR hydration issues
    editorProps: {
      attributes: {
        class: "prose prose-sm max-w-none focus:outline-none px-4 py-3 min-h-[200px] prose-stone",
      },
    },
    onUpdate: ({ editor }) => {
      // Automatically save content on update if needed
      const content = getOutput(editor, "html");
    },
  });

  // Update content when sheet opens
  useEffect(() => {
    if (isOpen && editor && initialContent !== editor.getHTML()) {
      editor.commands.setContent(initialContent);
    }
  }, [isOpen, initialContent, editor]);

  const handleSave = () => {
    if (editor) {
      const content = editor.getHTML();
      onSave(content);
    }
    onClose();
  };

  const handleOpenSheet = (sheet: string) => {
    if (!editor) return;
    
    switch (sheet) {
      case 'textStyles':
        onOpenTextStylesSheet?.(editor);
        break;
      case 'moreFormatting':
        onOpenMoreFormattingSheet?.(editor);
        break;
      case 'lists':
        onOpenListsSheet?.(editor);
        break;
      case 'insertElements':
        onOpenInsertElementsSheet?.(editor);
        break;
    }
  };

  return (
    <>
      <SheetWithDetentFull.Root
        presented={isOpen}
        onPresentedChange={(presented) => !presented && onClose()}
      >
        <SheetWithDetentFull.Portal>
          <SheetWithDetentFull.View>
            <SheetWithDetentFull.Backdrop />
            <SheetWithDetentFull.Content className="DescriptionSheet-content">
              {/* Fixed Header */}
              <div className="DescriptionSheet-header">
                <SheetWithDetentFull.Handle className="DescriptionSheet-handle" />
                <div className="DescriptionSheet-headerBar">
                  <button
                    onClick={onClose}
                    className="DescriptionSheet-headerButton DescriptionSheet-headerButton--cancel"
                  >
                    Cancel
                  </button>
                  <h1 className="DescriptionSheet-headerTitle">Edit Description</h1>
                  <button
                    onClick={handleSave}
                    className="DescriptionSheet-headerButton DescriptionSheet-headerButton--save"
                  >
                    Save
                  </button>
                </div>

                {/* Toolbar at top */}
                <div className="DescriptionSheet-toolbar">
                  <div className="DescriptionSheet-toolbarInner">
                    {editor && (
                      <>
                        <SectionOne editor={editor} onOpenSheet={handleOpenSheet} />
                        <Separator orientation="vertical" className="mx-2 h-7" />
                        <SectionTwo editor={editor} onOpenSheet={handleOpenSheet} />
                        <Separator orientation="vertical" className="mx-2 h-7" />
                        <SectionThree editor={editor} onOpenSheet={handleOpenSheet} />
                        <Separator orientation="vertical" className="mx-2 h-7" />
                        <SectionFour 
                          editor={editor} 
                          onOpenSheet={handleOpenSheet} 
                          onOpenLinkEditSheet={onOpenLinkEditSheet}
                        />
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Scrollable Editor Content */}
              <SheetWithDetentFull.ScrollRoot asChild>
                <SheetWithDetentFull.ScrollView className="DescriptionSheet-scrollView">
                  <SheetWithDetentFull.ScrollContent className="DescriptionSheet-scrollContent">
                    <EditorContent 
                      editor={editor} 
                      className="DescriptionSheet-editor"
                    />
                  </SheetWithDetentFull.ScrollContent>
                </SheetWithDetentFull.ScrollView>
              </SheetWithDetentFull.ScrollRoot>
            </SheetWithDetentFull.Content>
          </SheetWithDetentFull.View>
        </SheetWithDetentFull.Portal>
      </SheetWithDetentFull.Root>
    </>
  );
}