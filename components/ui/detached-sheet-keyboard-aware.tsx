"use client";

import React, { createContext, useContext, useRef, useEffect } from "react";
import { DetachedSheet } from "./detached-sheet";

// Context to share keyboard awareness state
type KeyboardAwareContextValue = {
  contentRef: React.RefObject<HTMLDivElement>;
};

const KeyboardAwareContext = createContext<KeyboardAwareContextValue | null>(null);

const useKeyboardAwareContext = () => {
  const context = useContext(KeyboardAwareContext);
  if (!context) {
    throw new Error(
      "useKeyboardAwareContext must be used within a DetachedSheetKeyboardAware.Root"
    );
  }
  return context;
};

// Root component that provides keyboard awareness
const DetachedSheetKeyboardAwareRoot = React.forwardRef<
  React.ElementRef<typeof DetachedSheet.Root>,
  React.ComponentPropsWithoutRef<typeof DetachedSheet.Root>
>(({ children, ...props }, ref) => {
  const contentRef = useRef<HTMLDivElement>(null);

  return (
    <KeyboardAwareContext.Provider value={{ contentRef }}>
      <DetachedSheet.Root {...props} ref={ref}>
        {children}
      </DetachedSheet.Root>
    </KeyboardAwareContext.Provider>
  );
});
DetachedSheetKeyboardAwareRoot.displayName = "DetachedSheetKeyboardAware.Root";

// Content component with keyboard handling
const DetachedSheetKeyboardAwareContent = React.forwardRef<
  React.ElementRef<typeof DetachedSheet.Content>,
  React.ComponentPropsWithoutRef<typeof DetachedSheet.Content>
>(({ children, onPointerDown, ...props }, ref) => {
  const { contentRef } = useKeyboardAwareContext();
  
  // Handle backdrop tap to dismiss keyboard
  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    // Check if the click is outside an input/textarea
    const target = e.target as HTMLElement;
    const isInputElement = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA';
    
    if (!isInputElement && contentRef.current) {
      // Find any focused input/textarea and blur it
      const activeElement = document.activeElement as HTMLElement;
      if (activeElement && (activeElement.tagName === 'INPUT' || activeElement.tagName === 'TEXTAREA')) {
        activeElement.blur();
      }
    }
    
    onPointerDown?.(e);
  };

  // Set ref for content
  const setRefs = React.useCallback((node: HTMLDivElement | null) => {
    // @ts-ignore - intentionally breaking the readonly nature for compatibility
    contentRef.current = node;

    if (typeof ref === "function") {
      ref(node);
    } else if (ref) {
      ref.current = node;
    }
  }, [contentRef, ref]);

  // Auto-adjust viewport when keyboard appears (mobile only)
  useEffect(() => {
    const handleFocus = (e: FocusEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
        // Small delay to ensure keyboard is shown
        setTimeout(() => {
          target.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 300);
      }
    };

    const content = contentRef.current;
    if (content) {
      content.addEventListener('focusin', handleFocus);
      return () => content.removeEventListener('focusin', handleFocus);
    }
  }, [contentRef]);

  return (
    <DetachedSheet.Content 
      {...props} 
      ref={setRefs}
      onPointerDown={handlePointerDown}
    >
      {children}
    </DetachedSheet.Content>
  );
});
DetachedSheetKeyboardAwareContent.displayName = "DetachedSheetKeyboardAware.Content";

// Export all components, using originals for unchanged ones
export const DetachedSheetKeyboardAware = {
  Root: DetachedSheetKeyboardAwareRoot,
  Portal: DetachedSheet.Portal,
  View: DetachedSheet.View,
  Backdrop: DetachedSheet.Backdrop,
  Content: DetachedSheetKeyboardAwareContent,
  Handle: DetachedSheet.Handle,
};