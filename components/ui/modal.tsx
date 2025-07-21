"use client";

import * as React from "react";

import { useMediaQuery } from "@/hooks/use-media-query";
import {
  Dialog,
  DialogTitle,
  DialogHeader,
  DialogContent,
  DialogTrigger,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Drawer,
  DrawerTitle,
  DrawerHeader,
  DrawerContent,
  DrawerTrigger,
  DrawerDescription,
} from "@/components/ui/drawer";

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
}) => {
  const { isMobile } = useMediaQuery();

  const dialogContentClassName = isWideDialog
    ? "min-w-[650px]"
    : "min-w-[425px]";

  if (!isMobile) {
    return (
      <Dialog open={open} onOpenChange={disableClose ? () => {} : setOpen}>
        {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
        <DialogContent
          className={dialogContentClassName}
          // @ts-ignore
          footerChildren={footer}
        >
          {(title || description) && (
            <DialogHeader>
              {title && <DialogTitle className="text-2xl">{title}</DialogTitle>}
              {description && (
                <DialogDescription>{description}</DialogDescription>
              )}
            </DialogHeader>
          )}
          {children}
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Drawer
      open={open}
      onOpenChange={disableClose ? () => {} : setOpen}
      dismissible={!disableClose}
    >
      {trigger && <DrawerTrigger asChild>{trigger}</DrawerTrigger>}
      <DrawerContent
        // @ts-ignore
        footerChildren={footer}
        isFullScreen={isMobileFullScreen}
        hideCloseButton={hideCloseButton || disableClose}
      >
        {!hideMobileHeader && (title || description) ? (
          <DrawerHeader className="pb-4 text-center">
            {title && (
              <DrawerTitle className="text-2xl font-medium">
                {title}
              </DrawerTitle>
            )}
            {description && (
              <DrawerDescription className="text-base md:text-lg px-6">
                {description}
              </DrawerDescription>
            )}
          </DrawerHeader>
        ) : null}
        {children}
      </DrawerContent>
    </Drawer>
  );
};