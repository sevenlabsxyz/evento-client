'use client';

import { create } from 'zustand';

interface WebViewState {
  url: string;
  isOpen: boolean;
  title?: string;
  openWebView: (url: string, title?: string) => void;
  closeWebView: () => void;
}

/**
 * A hook that provides access to the in-app web view functionality.
 * This allows opening URLs in an in-app browser without leaving the application.
 */
const useWebView = create<WebViewState>((set) => ({
  url: '',
  isOpen: false,
  title: undefined,
  
  /**
   * Opens the WebView with the specified URL
   * @param url The URL to open in the WebView
   * @param title Optional title for the WebView header
   */
  openWebView: (url: string, title?: string) => {
    // Make sure URL has a protocol
    const formattedUrl = url.startsWith('http') ? url : `https://${url}`;
    set({ url: formattedUrl, isOpen: true, title });
  },
  
  /**
   * Closes the WebView
   */
  closeWebView: () => {
    set({ isOpen: false });
  },
}));

export default useWebView;
