'use client';

import * as React from 'react';

import { CircledIconButton } from '@/components/circled-icon-button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from '@/components/ui/drawer';
import { useMediaQuery } from '@/lib/hooks/use-media-query';
import { cn } from '@/lib/utils';
import { X } from 'lucide-react';

export const Modal = ({
  open,
  setOpen,
  title,
  footer,
  trigger,
  children,
  description,
  isWideDialog,
  isMobileFullScreen,
  hideMobileHeader = false,
  hideCloseButton = false,
  disableClose = false,
  dialogContentClassName,
  drawerContentClassName,
  actionCloseButton = false,
  mobileHandleOnly = false,
}: {
  open: boolean;
  setOpen: (open: boolean) => void;
  title?: React.ReactNode;
  footer?: React.ReactNode;
  trigger?: React.ReactNode;
  children: React.ReactNode;
  description?: React.ReactNode;
  isWideDialog?: boolean;
  isMobileFullScreen?: boolean;
  hideMobileHeader?: boolean;
  hideCloseButton?: boolean;
  disableClose?: boolean;
  dialogContentClassName?: string;
  drawerContentClassName?: string;
  actionCloseButton?: boolean;
  mobileHandleOnly?: boolean;
}) => {
  const { isMobile } = useMediaQuery();

  const baseDialogContentClassName = isWideDialog ? 'min-w-[650px]' : 'min-w-[425px]';

  if (!isMobile) {
    return (
      <Dialog open={open} onOpenChange={disableClose ? () => {} : setOpen}>
        {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
        <DialogContent
          className={cn(baseDialogContentClassName, dialogContentClassName)}
          hideDefaultCloseButton={actionCloseButton}
        >
          {(title || description) && (
            <DialogHeader>
              {title && <DialogTitle className='text-2xl'>{title}</DialogTitle>}
              {description && <DialogDescription>{description}</DialogDescription>}
            </DialogHeader>
          )}
          {actionCloseButton && !hideCloseButton && !disableClose && (
            <CircledIconButton
              icon={X}
              ariaLabel='Close'
              className='absolute right-4 top-4 z-10'
              onClick={() => setOpen(false)}
            />
          )}
          {children}
          {footer}
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Drawer
      open={open}
      onOpenChange={disableClose ? () => {} : setOpen}
      dismissible={!disableClose}
      handleOnly={mobileHandleOnly}
    >
      {trigger && <DrawerTrigger asChild>{trigger}</DrawerTrigger>}
      <DrawerContent
        className={cn(isMobileFullScreen && 'h-[100dvh] max-h-[100dvh]', drawerContentClassName)}
      >
        {!hideMobileHeader && (title || description) ? (
          <div className='relative'>
            <DrawerHeader className='pb-4 text-center'>
              {title && <DrawerTitle className='text-2xl font-medium'>{title}</DrawerTitle>}
              {description && (
                <DrawerDescription className='px-6 text-base md:text-lg'>
                  {description}
                </DrawerDescription>
              )}
            </DrawerHeader>
            {!hideCloseButton && !disableClose && (
              <>
                {actionCloseButton ? (
                  <CircledIconButton
                    icon={X}
                    ariaLabel='Close'
                    className='absolute right-4 top-4 z-10'
                    onClick={() => setOpen(false)}
                  />
                ) : (
                  <button
                    type='button'
                    aria-label='Close'
                    className='absolute right-4 top-4 rounded-full p-2 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2'
                    onClick={() => setOpen(false)}
                  >
                    <X className='h-5 w-5' />
                  </button>
                )}
              </>
            )}
          </div>
        ) : null}
        {children}
        {footer}
      </DrawerContent>
    </Drawer>
  );
};
