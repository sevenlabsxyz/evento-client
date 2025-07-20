import type { Editor } from '@tiptap/core';

export const getOutput = (editor: Editor, format: 'html' | 'json' | 'text') => {
  switch (format) {
    case 'json':
      return JSON.stringify(editor.getJSON());
    case 'text':
      return editor.getText();
    case 'html':
    default:
      return editor.getHTML();
  }
};

export const activeItemClass = 'bg-red-50 text-red-600';

export const DropdownMenuItemClass = 'w-full text-left px-3 py-2 hover:bg-gray-50';

export interface LinkProps {
  url: string;
  text: string;
  openInNewTab: boolean;
}

export interface ShouldShowProps {
  editor: Editor;
  from: number;
  to: number;
}
