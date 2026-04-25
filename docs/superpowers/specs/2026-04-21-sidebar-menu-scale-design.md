# Sidebar Menu Scale Design

## Summary

Increase the expanded left-sidebar navigation so it feels closer in visual weight to the `AnimatedTabs` control used in the hub. The change should make rows taller, increase horizontal padding, enlarge label typography, and slightly increase icon size on both desktop and mobile.

## Goals

- Make expanded sidebar rows feel more like pill controls instead of compact list items.
- Apply the heavier sizing consistently across main navigation and footer actions.
- Preserve current behavior and structure for the collapsed icon rail.

## Non-Goals

- Redesign the sidebar layout, colors, or information architecture.
- Change destination URLs or navigation order.
- Rework the collapsed icon-only sidebar beyond what naturally follows from the shared size token.

## Approach

Add a new larger `SidebarMenuButton` size variant in [components/ui/sidebar.tsx](/Users/andreneves/Code/evento/evento-client/components/ui/sidebar.tsx). That variant should define:

- A taller row height than the current default.
- Increased horizontal padding.
- Larger label font size and weight appropriate for nav items.
- Slightly larger icon sizing.

Opt the dashboard sidebar into that new size from:

- [components/dashboard/nav-main.tsx](/Users/andreneves/Code/evento/evento-client/components/dashboard/nav-main.tsx)
- [components/dashboard/app-sidebar.tsx](/Users/andreneves/Code/evento/evento-client/components/dashboard/app-sidebar.tsx)
- [components/dashboard/nav-user.tsx](/Users/andreneves/Code/evento/evento-client/components/dashboard/nav-user.tsx) if its buttons should visually match the rest of the sidebar

The change should prefer the shared size variant over bespoke per-button overrides so the sidebar remains internally consistent.

## Component Impact

### Shared Sidebar Primitive

`SidebarMenuButton` gains a new size token to support a larger row treatment without changing existing consumers.

### App Sidebar

The dashboard sidebar opts into the larger token for primary and footer navigation so the expanded left rail reads closer to the hub tabs.

### Collapsed State

Collapsed icon-only behavior remains intact. Any visual changes in that state should only come from shared token sizing and should not make the collapsed rail feel oversized.

## Responsive Behavior

- Desktop: visibly taller rows with larger labels and icons.
- Mobile drawer: keep the same larger treatment so the navigation feels finger-friendly and matches the heavier UI language seen in the tab pills.

## Risks

- Over-sizing rows could make the left rail feel too sparse on shorter screens.
- Applying the larger size too broadly could unintentionally affect sidebars outside the dashboard if the new variant becomes the default.

## Mitigations

- Keep the new size opt-in rather than replacing the existing default size.
- Validate the expanded sidebar on both desktop and mobile layouts before considering the change done.

## Testing

- Visually verify expanded sidebar sizing in desktop layout.
- Visually verify mobile drawer sizing and tap target comfort.
- Confirm collapsed icon-only rail still behaves correctly.
- Run any focused component or lint/test command needed if the implementation touches shared sidebar primitives.
