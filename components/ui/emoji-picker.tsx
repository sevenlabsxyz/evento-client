"use client";

import * as React from "react";
import { EmojiPicker as EmojiPickerPrimitive } from "frimousse";
import { cn } from "@/lib/utils";

interface EmojiPickerProps {
  onEmojiSelect?: (emoji: { emoji: string }) => void;
  className?: string;
  children?: React.ReactNode;
}

const EmojiPicker = React.forwardRef<HTMLDivElement, EmojiPickerProps>(
  ({ onEmojiSelect, className, children, ...props }, ref) => (
    <EmojiPickerPrimitive.Root
      ref={ref}
      className={cn(
        "isolate flex h-[368px] w-fit flex-col bg-white dark:bg-neutral-900 border border-gray-200 rounded-lg",
        className
      )}
      onEmojiSelect={onEmojiSelect}
      {...props}
    >
      {children}
    </EmojiPickerPrimitive.Root>
  )
);
EmojiPicker.displayName = "EmojiPicker";

const EmojiPickerSearch = React.forwardRef<
  HTMLInputElement,
  React.ComponentPropsWithoutRef<typeof EmojiPickerPrimitive.Search>
>(({ className, ...props }, ref) => (
  <EmojiPickerPrimitive.Search
    ref={ref}
    className={cn(
      "z-10 mx-2 mt-2 appearance-none rounded-md bg-neutral-100 px-2.5 py-2 text-sm dark:bg-neutral-800 border-none outline-none focus:ring-0",
      className
    )}
    placeholder="Search emojis..."
    {...props}
  />
));
EmojiPickerSearch.displayName = "EmojiPickerSearch";

const EmojiPickerContent = React.forwardRef<
  HTMLDivElement,
  React.ComponentPropsWithoutRef<typeof EmojiPickerPrimitive.Viewport>
>(({ className, ...props }, ref) => (
  <EmojiPickerPrimitive.Viewport
    ref={ref}
    className={cn("relative flex-1 outline-hidden", className)}
    {...props}
  >
    <EmojiPickerPrimitive.Loading className="absolute inset-0 flex items-center justify-center text-neutral-400 text-sm dark:text-neutral-500">
      Loading…
    </EmojiPickerPrimitive.Loading>
    <EmojiPickerPrimitive.Empty className="absolute inset-0 flex items-center justify-center text-neutral-400 text-sm dark:text-neutral-500">
      No emoji found.
    </EmojiPickerPrimitive.Empty>
    <EmojiPickerPrimitive.List
      className="select-none pb-1.5"
      components={{
        CategoryHeader: ({ category, ...props }) => (
          <div
            className="bg-white px-3 pt-3 pb-1.5 font-medium text-neutral-600 text-xs dark:bg-neutral-900 dark:text-neutral-400 sticky top-0"
            {...props}
          >
            {category.label}
          </div>
        ),
        Row: ({ children, ...props }) => (
          <div className="scroll-my-1.5 px-1.5" {...props}>
            {children}
          </div>
        ),
        Emoji: ({ emoji, ...props }) => (
          <button
            className="flex size-8 items-center justify-center rounded-md text-lg data-[active]:bg-neutral-100 dark:data-[active]:bg-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
            {...props}
          >
            {emoji.emoji}
          </button>
        ),
      }}
    />
  </EmojiPickerPrimitive.Viewport>
));
EmojiPickerContent.displayName = "EmojiPickerContent";

const EmojiPickerFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "flex items-center justify-between px-3 py-2 border-t border-gray-200 dark:border-neutral-700",
      className
    )}
    {...props}
  />
));
EmojiPickerFooter.displayName = "EmojiPickerFooter";

export {
  EmojiPicker,
  EmojiPickerSearch,
  EmojiPickerContent,
  EmojiPickerFooter,
};