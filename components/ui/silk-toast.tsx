'use client';
import { Sheet, useClientMediaQuery } from '@silk-hq/components';
import { AlertTriangle, CheckCircle, Info, XCircle } from 'lucide-react';
import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import './silk-toast.css';

// ================================================================================================
// Types
// ================================================================================================

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface ToastProps {
  id: string;
  type: ToastType;
  title?: string;
  description: string;
  duration?: number;
  onDismiss?: () => void;
}

// ================================================================================================
// Context
// ================================================================================================

type ToastContextValue = {
  presented: boolean;
  setPresented: (presented: boolean) => void;
  pointerOver: boolean;
  setPointerOver: (pointerOver: boolean) => void;
  travelStatus: string;
  setTravelStatus: (status: string) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

// ================================================================================================
// Toast Icons
// ================================================================================================

const getToastIcon = (type: ToastType) => {
  switch (type) {
    case 'success':
      return <CheckCircle className='h-5 w-5 text-white' />;
    case 'error':
      return <XCircle className='h-5 w-5 text-white' />;
    case 'info':
      return <Info className='h-5 w-5 text-white' />;
    case 'warning':
      return <AlertTriangle className='h-5 w-5 text-white' />;
    default:
      return <Info className='h-5 w-5 text-white' />;
  }
};

const getToastColors = (type: ToastType) => {
  switch (type) {
    case 'success':
      return 'toast-success';
    case 'error':
      return 'toast-error';
    case 'info':
      return 'toast-info';
    case 'warning':
      return 'toast-warning';
    default:
      return 'toast-info';
  }
};

// ================================================================================================
// Toast Root
// ================================================================================================

const ToastRoot = React.forwardRef<
  React.ElementRef<typeof Sheet.Root>,
  React.ComponentPropsWithoutRef<typeof Sheet.Root> & {
    duration?: number;
    onDismiss?: () => void;
  }
>(({ children, duration = 5000, onDismiss, ...restProps }, ref) => {
  const [presented, setPresented] = useState(true);
  const [pointerOver, setPointerOver] = useState(false);
  const [travelStatus, setTravelStatus] = useState('idleOutside');
  const autoCloseTimeout = useRef<ReturnType<typeof setTimeout> | undefined>();

  useEffect(() => {
    const startAutoCloseTimeout = () => {
      autoCloseTimeout.current = setTimeout(() => {
        setPresented(false);
        onDismiss?.();
      }, duration);
    };

    const clearAutoCloseTimeout = () => {
      clearTimeout(autoCloseTimeout.current);
    };

    if (presented) {
      if (travelStatus === 'idleInside' && !pointerOver) {
        startAutoCloseTimeout();
      } else {
        clearAutoCloseTimeout();
      }
    }
    return clearAutoCloseTimeout;
  }, [presented, travelStatus, pointerOver, duration, onDismiss]);

  const handlePresentedChange = (newPresented: boolean) => {
    setPresented(newPresented);
    if (!newPresented) {
      onDismiss?.();
    }
  };

  return (
    <ToastContext.Provider
      value={{
        presented,
        setPresented,
        pointerOver,
        setPointerOver,
        travelStatus,
        setTravelStatus,
      }}
    >
      <Sheet.Root
        license='commercial'
        presented={presented}
        onPresentedChange={handlePresentedChange}
        sheetRole=''
        {...restProps}
        ref={ref}
      >
        {children}
      </Sheet.Root>
    </ToastContext.Provider>
  );
});
ToastRoot.displayName = 'Toast.Root';

// ================================================================================================
// Toast View
// ================================================================================================

const ToastView = React.forwardRef<
  HTMLDivElement,
  React.ComponentPropsWithoutRef<typeof Sheet.View>
>(({ children, className, ...restProps }, ref) => {
  const largeViewport = useClientMediaQuery('(min-width: 1000px)');
  const contentPlacement = largeViewport ? 'right' : 'top';

  const context = useContext(ToastContext);
  if (!context) throw new Error('ToastView must be used within a ToastContext.Provider');
  const { setTravelStatus } = context;

  return (
    <div
      className={`toast-container ${className ?? ''}`.trim()}
      role='status'
      aria-live='polite'
      {...restProps}
      ref={ref}
    >
      <Sheet.View
        className={`toast-view ${className ?? ''}`.trim()}
        contentPlacement={contentPlacement}
        inertOutside={false}
        onPresentAutoFocus={{ focus: false }}
        onDismissAutoFocus={{ focus: false }}
        onClickOutside={{
          dismiss: true,
          stopOverlayPropagation: false,
        }}
        onEscapeKeyDown={{
          dismiss: true,
          stopOverlayPropagation: false,
        }}
        onTravelStatusChange={setTravelStatus}
        travelAnimation={{
          opacity: [0, 1],
          scale: [0.95, 1],
          transformOrigin: largeViewport ? 'top right' : 'top center',
        }}
      >
        {children}
      </Sheet.View>
    </div>
  );
});
ToastView.displayName = 'Toast.View';

// ================================================================================================
// Toast Content
// ================================================================================================

const ToastContent = React.forwardRef<
  React.ElementRef<typeof Sheet.Content>,
  React.ComponentPropsWithoutRef<typeof Sheet.Content>
>(({ children, className, ...restProps }, ref) => {
  const context = useContext(ToastContext);
  if (!context) throw new Error('ToastContent must be used within ToastRoot');

  return (
    <Sheet.Content
      className={`toast-content ${className ?? ''}`.trim()}
      asChild
      {...restProps}
      ref={ref}
    >
      <Sheet.SpecialWrapper.Root>
        <Sheet.SpecialWrapper.Content
          className='toast-inner-content'
          onPointerEnter={() => context.setPointerOver(true)}
          onPointerLeave={() => context.setPointerOver(false)}
        >
          {children}
        </Sheet.SpecialWrapper.Content>
      </Sheet.SpecialWrapper.Root>
    </Sheet.Content>
  );
});
ToastContent.displayName = 'Toast.Content';

// ================================================================================================
// Complete Toast Component
// ================================================================================================

export const SilkToast = React.forwardRef<React.ElementRef<typeof Sheet.Root>, ToastProps>(
  ({ id, type, title, description, duration, onDismiss }, ref) => {
    const icon = getToastIcon(type);
    const colorClass = getToastColors(type);

    return (
      <ToastRoot ref={ref} duration={duration} onDismiss={onDismiss} forComponent='closest'>
        <Sheet.Portal>
          <ToastView>
            <ToastContent>
              <div className={`toast-root ${colorClass}`}>
                <div className='toast-icon'>{icon}</div>
                <div className='toast-content-wrapper'>
                  {title && <Sheet.Title className='toast-title'>{title}</Sheet.Title>}
                  <Sheet.Description className='toast-description'>{description}</Sheet.Description>
                </div>
              </div>
            </ToastContent>
          </ToastView>
        </Sheet.Portal>
      </ToastRoot>
    );
  }
);
SilkToast.displayName = 'SilkToast';

// ================================================================================================
// Exports
// ================================================================================================

export const SilkToastComponents = {
  Root: ToastRoot,
  Portal: Sheet.Portal,
  View: ToastView,
  Content: ToastContent,
  Title: Sheet.Title,
  Description: Sheet.Description,
};
