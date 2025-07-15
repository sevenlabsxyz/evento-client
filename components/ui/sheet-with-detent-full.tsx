"use client";
import React from "react";
import { Sheet, Scroll } from "@silk-hq/components";
import "./sheet-with-detent.css";

// ================================================================================================
// Root
// ================================================================================================

type SheetRootProps = React.ComponentPropsWithoutRef<typeof Sheet.Root>;
type SheetWithDetentFullRootProps = Omit<SheetRootProps, "license"> & {
  license?: SheetRootProps["license"];
};

const SheetWithDetentFullRoot = React.forwardRef<
  React.ElementRef<typeof Sheet.Root>,
  SheetWithDetentFullRootProps
>(({ children, ...restProps }, ref) => {
  return (
    <Sheet.Root license="commercial" {...restProps} ref={ref}>
      {children}
    </Sheet.Root>
  );
});
SheetWithDetentFullRoot.displayName = "SheetWithDetentFull.Root";

// ================================================================================================
// View - Always opens at full height
// ================================================================================================

const SheetWithDetentFullView = React.forwardRef<
  React.ElementRef<typeof Sheet.View>,
  React.ComponentPropsWithoutRef<typeof Sheet.View>
>((props, ref) => {
  return (
    <Sheet.View
      {...props}
      className={`SheetWithDetent-view ${props.className ?? ""}`.trim()}
      swipeOvershoot={false}
      nativeEdgeSwipePrevention={true}
      ref={ref}
    />
  );
});
SheetWithDetentFullView.displayName = "SheetWithDetentFull.View";

// ================================================================================================
// Backdrop
// ================================================================================================

const SheetWithDetentFullBackdrop = React.forwardRef<
  React.ElementRef<typeof Sheet.Backdrop>,
  React.ComponentPropsWithoutRef<typeof Sheet.Backdrop>
>(({ className, ...restProps }, ref) => {
  return (
    <Sheet.Backdrop
      className={`SheetWithDetent-backdrop ${className ?? ""}`.trim()}
      themeColorDimming="auto"
      {...restProps}
      ref={ref}
    />
  );
});
SheetWithDetentFullBackdrop.displayName = "SheetWithDetentFull.Backdrop";

// ================================================================================================
// Content
// ================================================================================================

const SheetWithDetentFullContent = React.forwardRef<
  React.ElementRef<typeof Sheet.Content>,
  React.ComponentPropsWithoutRef<typeof Sheet.Content>
>(({ children, className, ...restProps }, ref) => {
  return (
    <Sheet.Content
      className={`SheetWithDetent-content ${className ?? ""}`.trim()}
      {...restProps}
      ref={ref}
    >
      {children}
    </Sheet.Content>
  );
});
SheetWithDetentFullContent.displayName = "SheetWithDetentFull.Content";

// ================================================================================================
// Handle
// ================================================================================================

const SheetWithDetentFullHandle = React.forwardRef<
  React.ElementRef<typeof Sheet.Handle>,
  React.ComponentPropsWithoutRef<typeof Sheet.Handle>
>(({ className, ...restProps }, ref) => {
  return (
    <Sheet.Handle
      className={`SheetWithDetent-handle ${className ?? ""}`.trim()}
      action="dismiss"
      {...restProps}
      ref={ref}
    />
  );
});
SheetWithDetentFullHandle.displayName = "SheetWithDetentFull.Handle";

// ================================================================================================
// Scroll Components
// ================================================================================================

const SheetWithDetentFullScrollRoot = React.forwardRef<
  React.ElementRef<typeof Scroll.Root>,
  React.ComponentPropsWithoutRef<typeof Scroll.Root>
>((props, ref) => {
  return <Scroll.Root {...props} ref={ref} />;
});
SheetWithDetentFullScrollRoot.displayName = "SheetWithDetentFull.ScrollRoot";

const SheetWithDetentFullScrollView = React.forwardRef<
  React.ElementRef<typeof Scroll.View>,
  React.ComponentPropsWithoutRef<typeof Scroll.View>
>(({ children, className, ...restProps }, ref) => {
  return (
    <Scroll.View
      className={`SheetWithDetent-scrollView ${className ?? ""}`.trim()}
      scrollGestureTrap={{ yEnd: true }}
      safeArea="layout-viewport"
      onScrollStart={{ dismissKeyboard: true }}
      {...restProps}
      ref={ref}
    >
      {children}
    </Scroll.View>
  );
});
SheetWithDetentFullScrollView.displayName = "SheetWithDetentFull.ScrollView";

const SheetWithDetentFullScrollContent = React.forwardRef<
  React.ElementRef<typeof Scroll.Content>,
  React.ComponentPropsWithoutRef<typeof Scroll.Content>
>(({ children, className, ...restProps }, ref) => {
  return (
    <Scroll.Content
      className={`SheetWithDetent-scrollContent ${className ?? ""}`.trim()}
      {...restProps}
      ref={ref}
    >
      {children}
    </Scroll.Content>
  );
});
SheetWithDetentFullScrollContent.displayName = "SheetWithDetentFull.ScrollContent";

// ================================================================================================
// Unchanged Components
// ================================================================================================

const SheetWithDetentFullPortal = Sheet.Portal;
const SheetWithDetentFullTrigger = Sheet.Trigger;
const SheetWithDetentFullOutlet = Sheet.Outlet;
const SheetWithDetentFullTitle = Sheet.Title;
const SheetWithDetentFullDescription = Sheet.Description;

export const SheetWithDetentFull = {
  Root: SheetWithDetentFullRoot,
  Portal: SheetWithDetentFullPortal,
  View: SheetWithDetentFullView,
  Backdrop: SheetWithDetentFullBackdrop,
  Content: SheetWithDetentFullContent,
  Trigger: SheetWithDetentFullTrigger,
  Handle: SheetWithDetentFullHandle,
  Outlet: SheetWithDetentFullOutlet,
  Title: SheetWithDetentFullTitle,
  Description: SheetWithDetentFullDescription,
  ScrollRoot: SheetWithDetentFullScrollRoot,
  ScrollView: SheetWithDetentFullScrollView,
  ScrollContent: SheetWithDetentFullScrollContent,
};