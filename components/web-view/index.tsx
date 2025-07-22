'use client';

import { Button } from '@/components/ui/button';
import { SheetWithDetentFull } from '@/components/ui/sheet-with-detent-full';
import useWebView from '@/hooks/useWebView';
import { getDomainFromUrl } from '@/lib/utils/url';
import { ArrowLeft, ExternalLink, RefreshCcw, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

export default function WebView() {
  const { isOpen, url, title, closeWebView } = useWebView();
  const displayTitle = title || (url ? getDomainFromUrl(url) : '');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [iframeHistory, setIframeHistory] = useState<string[]>([]);
  const [currentUrlIndex, setCurrentUrlIndex] = useState(-1);

  useEffect(() => {
    if (isOpen && url) {
      // Reset state
      setLoading(true);
      setError(null);

      // Reset history when opening a new URL
      setIframeHistory([url]);
      setCurrentUrlIndex(0);

      // Add a safety timeout to hide loading indicator after 10 seconds
      // even if onLoad doesn't fire properly
      const loadingTimeout = setTimeout(() => {
        setLoading(false);
      }, 10000);

      // Check if the URL contains embedded credentials
      if (url.match(/https?:\/\/[^/]+:[^/]+@[^/]+\//)) {
        setError(
          'This website cannot be displayed in the app due to security restrictions.'
        );
        setLoading(false);
        clearTimeout(loadingTimeout); // Clear timeout if we've already set loading to false
        console.warn(
          'WebView: URL contains embedded credentials (e.g. `https://user:pass@host/`) which are blocked.'
        );
      } else {
        // Log general warning about embedded credentials in subresource requests
        console.warn(
          'WebView: Subresource requests whose URLs contain embedded credentials (e.g. `https://user:pass@host/`) are blocked.'
        );
      }

      // Add event listener for back button
      const handleBackButton = (e: PopStateEvent) => {
        e.preventDefault();
        closeWebView();
        // Push a new state to replace the one we just popped
        window.history.pushState(null, '', window.location.pathname);
      };

      // Push state before adding listener so we can intercept the back action
      window.history.pushState(null, '', window.location.pathname);
      window.addEventListener('popstate', handleBackButton);

      // Combined cleanup function
      return () => {
        clearTimeout(loadingTimeout);
        window.removeEventListener('popstate', handleBackButton);
      };
    }
  }, [url, isOpen, closeWebView]);

  const handleIframeLoad = () => {
    // Log for debugging
    console.log('iframe onLoad fired');
    setLoading(false);

    // Try to detect if the iframe loaded properly
    try {
      // This will throw an error if there's X-Frame-Options restriction
      const currentLocation = iframeRef.current?.contentWindow?.location?.href;
      if (currentLocation) {
        setError(null);
        console.log('iframe loaded successfully:', currentLocation);
      }
    } catch (e) {
      // X-Frame-Options or other security restriction
      console.error('iframe load error:', e);
      setError(
        'This website cannot be displayed in the app due to security restrictions.'
      );
    }
  };

  const handleIframeError = () => {
    setLoading(false);
    setError('Failed to load the website. It may not allow embedding.');
  };

  const handleGoBack = () => {
    if (currentUrlIndex > 0) {
      setLoading(true);
      setError(null);
      setCurrentUrlIndex(currentUrlIndex - 1);
    }
  };

  const handleRefresh = () => {
    setLoading(true);
    setError(null);
    if (iframeRef.current) {
      iframeRef.current.src = iframeHistory[currentUrlIndex];
    }
  };

  const handleOpenExternal = () => {
    // Actually open in external browser when requested
    window.open(url, '_blank', 'noopener,noreferrer');
    closeWebView();
  };

  return (
    <SheetWithDetentFull.Root
      presented={isOpen}
      onPresentedChange={(presented) => {
        if (!presented) closeWebView();
      }}
      activeDetent={1}
      onActiveDetentChange={() => {}}
    >
      <SheetWithDetentFull.Portal>
        <SheetWithDetentFull.View
          style={{
            borderRadius: 0,
            height: '100%',
            width: '100%',
          }}
        >
          <SheetWithDetentFull.Content
            className="grid grid-rows-[auto_auto_1fr]"
            style={{
              borderRadius: 0,
              width: '100%',
              maxWidth: 'none',
            }}
          >
            {/* Top Handle Bar */}
            <div className="bg-white py-2 flex justify-center">
              <SheetWithDetentFull.Handle />
            </div>

            {/* Navigation Bar */}
            <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleGoBack}
                  disabled={currentUrlIndex <= 0}
                  className="h-8 w-8 rounded-full"
                >
                  <ArrowLeft className="h-4 w-4" />
                  <span className="sr-only">Back</span>
                </Button>

                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleRefresh}
                  className="h-8 w-8 rounded-full"
                >
                  <RefreshCcw className="h-4 w-4" />
                  <span className="sr-only">Refresh</span>
                </Button>
              </div>

              <div className="flex-1 mx-2 truncate text-sm font-medium text-center">
                {displayTitle}
              </div>

              <div className="flex items-center gap-3">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleOpenExternal}
                  className="h-8 w-8 rounded-full"
                  title="Open in browser"
                >
                  <ExternalLink className="h-4 w-4" />
                  <span className="sr-only">Open in browser</span>
                </Button>

                <Button
                  variant="ghost"
                  size="icon"
                  onClick={closeWebView}
                  className="h-8 w-8 rounded-full"
                >
                  <X className="h-4 w-4" />
                  <span className="sr-only">Close</span>
                </Button>
              </div>
            </div>

            {/* Content Area */}
            <div className="relative h-full w-full bg-white">
              {loading && (
                <div className="absolute inset-0 flex items-center justify-center bg-gray-50">
                  <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-blue-600"></div>
                </div>
              )}

              {error && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-50 p-4 text-center">
                  <p className="mb-2 text-red-600">{error}</p>
                  <p className="mb-4 text-gray-600">
                    Try opening this link in your external browser instead.
                  </p>
                  <Button onClick={handleOpenExternal}>Open in Browser</Button>
                </div>
              )}

              {url && !error && (
                <iframe
                  key={iframeHistory[currentUrlIndex]} // Force re-render on URL change
                  ref={iframeRef}
                  src={iframeHistory[currentUrlIndex]}
                  title={displayTitle}
                  className="h-full w-full"
                  sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox"
                  onLoad={handleIframeLoad}
                  onError={handleIframeError}
                  style={{ visibility: loading ? 'hidden' : 'visible' }} // Hide iframe while loading to prevent flashes
                />
              )}
            </div>
          </SheetWithDetentFull.Content>
        </SheetWithDetentFull.View>
      </SheetWithDetentFull.Portal>
    </SheetWithDetentFull.Root>
  );
}
