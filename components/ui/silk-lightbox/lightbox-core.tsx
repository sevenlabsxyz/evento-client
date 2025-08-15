"use client";
import { SheetWithDetent } from "@/components/ui/sheet-with-detent";
import { Sheet, useClientMediaQuery } from "@silk-hq/components";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import "./lightbox-core.css";

// ================================================================================================
// Context
// ================================================================================================

interface LightboxContextValue {
  status: string;
  range: { start: number; end: number };
  contentClicked: boolean;
  UIVisible: boolean;
  onTravelStatusChange: (status: string) => void;
  onTravelRangeChange: (range: { start: number; end: number }) => void;
  contentClickHandler: () => void;
}

const LightboxContext = createContext<LightboxContextValue | null>(null);

const useLightboxContext = () => {
  const context = useContext(LightboxContext);
  if (!context) {
    throw new Error("useLightbox must be used within a LightboxRoot");
  }
  return context;
};

// ================================================================================================
// Root
// ================================================================================================

type SheetRootProps = React.ComponentPropsWithoutRef<typeof Sheet.Root>;
type LightboxRootProps = Omit<SheetRootProps, "license"> & {
  license?: SheetRootProps["license"];
};

const LightboxRoot = React.forwardRef<
  React.ElementRef<typeof Sheet.Root>,
  LightboxRootProps
>(({ children, className, ...restProps }, ref) => {
  const [status, setStatus] = useState("idleOutside");
  const [range, setRange] = useState({ start: 0, end: 0 });

  const [contentClicked, setContentClicked] = useState(false);
  const contentClickHandler = useCallback(
    () => setContentClicked((value) => !value),
    [],
  );
  useEffect(() => {
    // Reset the value when dismissed
    if (status === "idleOutside") setContentClicked(false);
  }, [status]);

  const UIVisible = useMemo(
    () => range.start === 1 && range.end === 1 && !contentClicked,
    [range, contentClicked],
  );

  const contextValue = useMemo(
    () => ({
      status,
      range,
      contentClicked,
      UIVisible,
      onTravelStatusChange: setStatus,
      onTravelRangeChange: setRange,
      contentClickHandler,
    }),
    [status, range, contentClicked, UIVisible, contentClickHandler],
  );

  return (
    <LightboxContext.Provider value={contextValue}>
      <Sheet.Root
        className={`Lightbox-root ${className ?? ""}`.trim()}
        license="commercial"
        {...restProps}
        ref={ref}
      >
        {children}
      </Sheet.Root>
    </LightboxContext.Provider>
  );
});
LightboxRoot.displayName = "Lightbox.Root";

// ================================================================================================
// View
// ================================================================================================

const LightboxView = React.forwardRef<
  React.ElementRef<typeof Sheet.View>,
  React.ComponentPropsWithoutRef<typeof Sheet.View>
>(({ children, className, ...restProps }, ref) => {
  const { onTravelStatusChange, onTravelRangeChange, contentClickHandler } =
    useLightboxContext();

  return (
    <Sheet.View
      className={`Lightbox-view ${className ?? ""}`.trim()}
      contentPlacement="center"
      tracks={["top", "bottom"]}
      nativeEdgeSwipePrevention={true}
      onClickOutside={(event) => {
        event.changeDefault({ dismiss: false });
        contentClickHandler();
      }}
      exitingAnimationSettings={{
        preset: "gentle",
      }}
      onTravelStatusChange={onTravelStatusChange}
      onTravelRangeChange={onTravelRangeChange}
      {...restProps}
      ref={ref}
    >
      {children}
    </Sheet.View>
  );
});
LightboxView.displayName = "Lightbox.View";

// ================================================================================================
// Backdrop
// ================================================================================================

const LightboxBackdrop = React.forwardRef<
  React.ElementRef<typeof Sheet.Backdrop>,
  React.ComponentPropsWithoutRef<typeof Sheet.Backdrop>
>(({ className, ...restProps }, ref) => {
  return (
    <Sheet.Backdrop
      className={`Lightbox-backdrop ${className ?? ""}`.trim()}
      themeColorDimming="auto"
      travelAnimation={{
        opacity: [0, 1],
      }}
      {...restProps}
      ref={ref}
    />
  );
});
LightboxBackdrop.displayName = "Lightbox.Backdrop";

// ================================================================================================
// Content
// ================================================================================================

type LightboxContentProps = React.ComponentPropsWithoutRef<
  typeof Sheet.Content
>;

const LightboxContent = React.forwardRef<
  React.ElementRef<typeof Sheet.Content>,
  LightboxContentProps
>(({ children, className, ...restProps }, ref) => {
  const { contentClickHandler } = useLightboxContext();

  return (
    <Sheet.Content
      className={`Lightbox-content ${className ?? ""}`.trim()}
      onClick={contentClickHandler}
      {...restProps}
      ref={ref}
    >
      {children}
    </Sheet.Content>
  );
});
LightboxContent.displayName = "Lightbox.Content";

// ================================================================================================
// DismissTrigger
// ================================================================================================

const LightboxDismissTrigger = React.forwardRef<
  React.ElementRef<typeof Sheet.Trigger>,
  React.ComponentPropsWithoutRef<typeof Sheet.Trigger>
>(({ children, className, ...restProps }, ref) => {
  const { UIVisible } = useLightboxContext();

  return (
    <Sheet.Trigger
      className={`Lightbox-dismissTrigger visible-${UIVisible} ${className ?? ""}`.trim()}
      action="dismiss"
      {...restProps}
      ref={ref}
    >
      {children}
    </Sheet.Trigger>
  );
});
LightboxDismissTrigger.displayName = "Lightbox.DismissTrigger";

// ================================================================================================
// Side content
// ================================================================================================

const LightboxSideContent = ({
  children,
  className,
  travelAnimation,
  ...restProps
}: React.ComponentPropsWithoutRef<typeof Sheet.Outlet>) => {
  const largeViewport = useClientMediaQuery("(min-width: 1200px)");

  if (!largeViewport) {
    return null;
  }

  return (
    <Sheet.Outlet
      className={`Lightbox-sidebar ${className ?? ""}`.trim()}
      travelAnimation={{
        opacity: [0, 1],
        ...travelAnimation,
      }}
      {...restProps}
    >
      {children}
    </Sheet.Outlet>
  );
};
LightboxSideContent.displayName = "Lightbox.SideContent";

// ================================================================================================
// SideSheet PresentTrigger
// ================================================================================================

const LightboxSideSheetPresentTrigger = ({
  children,
  className,
  ...restProps
}: React.ComponentPropsWithoutRef<typeof SheetWithDetent.Trigger>) => {
  const { UIVisible } = useLightboxContext();
  const largeViewport = useClientMediaQuery("(min-width: 1200px)");

  if (largeViewport) {
    return null;
  }

  return (
    <SheetWithDetent.Trigger
      className={`Lightbox-sideSheetPresentTrigger visible-${UIVisible} ${className ?? ""}`.trim()}
      {...restProps}
    >
      {children}
    </SheetWithDetent.Trigger>
  );
};
LightboxSideSheetPresentTrigger.displayName =
  "Lightbox.SideSheetPresentTrigger";

// ================================================================================================
// SideSheet View
// ================================================================================================

const LightboxSideSheetView = ({
  children,
  ...restProps
}: React.ComponentPropsWithoutRef<typeof SheetWithDetent.View>) => {
  const largeViewport = useClientMediaQuery("(min-width: 1200px)");

  if (largeViewport) {
    return null;
  }

  return (
    <SheetWithDetent.View enteringAnimationSettings="snappy" {...restProps}>
      {children}
    </SheetWithDetent.View>
  );
};
LightboxSideSheetView.displayName = "Lightbox.SideSheetView";

// ================================================================================================
// SideSheet Content
// ================================================================================================

const LightboxSideSheetContent = ({
  children,
  className,
  ...restProps
}: React.ComponentPropsWithoutRef<typeof SheetWithDetent.Content>) => {
  return (
    <SheetWithDetent.Content
      className={`Lightbox-sideSheetContent ${className ?? ""}`.trim()}
      {...restProps}
    >
      {children}
    </SheetWithDetent.Content>
  );
};
LightboxSideSheetContent.displayName = "Lightbox.SideSheetContent";

// ================================================================================================
// Unchanged Components
// ================================================================================================

// Main sheet
const LightboxPortal = Sheet.Portal;
const LightboxTrigger = Sheet.Trigger;
const LightboxOutlet = Sheet.Outlet;
const LightboxTitle = Sheet.Title;
const LightboxDescription = Sheet.Description;
// Side sheet
const LightboxSideSheetRoot = SheetWithDetent.Root;
const LightboxSideSheetPortal = SheetWithDetent.Portal;
const LightboxSideSheetBackdrop = SheetWithDetent.Backdrop;
const LightboxSideSheetTitle = SheetWithDetent.Title;
const LightboxSideSheetDescription = SheetWithDetent.Description;
const LightboxSideSheetTrigger = SheetWithDetent.Trigger;
const LightboxSideSheetHandle = SheetWithDetent.Handle;
const LightboxSideSheetScrollRoot = SheetWithDetent.ScrollRoot;
const LightboxSideSheetScrollView = SheetWithDetent.ScrollView;
const LightboxSideSheetScrollContent = SheetWithDetent.ScrollContent;

export const Lightbox = {
  // Main sheet
  Root: LightboxRoot,
  Portal: LightboxPortal,
  View: LightboxView,
  Backdrop: LightboxBackdrop,
  Trigger: LightboxTrigger,
  Outlet: LightboxOutlet,
  Content: LightboxContent,
  DismissTrigger: LightboxDismissTrigger,
  Title: LightboxTitle,
  Description: LightboxDescription,
  SideContent: LightboxSideContent,
  // Side sheet
  SideSheetRoot: LightboxSideSheetRoot,
  SideSheetPortal: LightboxSideSheetPortal,
  SideSheetView: LightboxSideSheetView,
  SideSheetBackdrop: LightboxSideSheetBackdrop,
  SideSheetContent: LightboxSideSheetContent,
  SideSheetPresentTrigger: LightboxSideSheetPresentTrigger,
  SideSheetTrigger: LightboxSideSheetTrigger,
  SideSheetHandle: LightboxSideSheetHandle,
  SideSheetScrollRoot: LightboxSideSheetScrollRoot,
  SideSheetScrollView: LightboxSideSheetScrollView,
  SideSheetScrollContent: LightboxSideSheetScrollContent,
  SideSheetTitle: LightboxSideSheetTitle,
  SideSheetDescription: LightboxSideSheetDescription,
};
