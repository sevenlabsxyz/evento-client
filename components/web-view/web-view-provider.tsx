'use client';

import { ReactNode } from 'react';

import WebView from '@/components/web-view';

interface WebViewProviderProps {
  children: ReactNode;
}

/**
 * WebViewProvider component that renders WebView at the app root level
 * @param children React children components
 */
export default function WebViewProvider({ children }: WebViewProviderProps) {
  return (
    <>
      {children}
      {/* Render WebView at the root level to make it accessible globally */}
      <WebView />
    </>
  );
}
