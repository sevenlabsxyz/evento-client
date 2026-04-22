# Sidebar Hugeicons Design

## Summary

Replace every icon used in the dashboard sidebar with Hugeicons equivalents, using a consistent `strokeWidth` of `1.5`. The wallet entry should specifically use `BitcoinEllipse`. The collapsed sidebar must keep icon-only buttons visually centered.

## Goals

- Move the sidebar to a single Hugeicons visual language.
- Keep icon sizing and stroke treatment consistent across the full sidebar.
- Preserve the larger row sizing already introduced for the expanded sidebar.
- Ensure collapsed icon-only rows remain centered after the icon swap.

## Non-Goals

- Redesign sidebar destinations, ordering, or copy.
- Change the create-event plus icon unless required by the global sidebar icon swap.
- Rework non-sidebar iconography elsewhere in the app.

## Approach

Install the Hugeicons React package and introduce a thin shared sidebar icon wrapper to normalize:

- icon size
- `strokeWidth={1.5}`
- any class names needed for sidebar-specific alignment

Use that wrapper to replace all sidebar icon usages in:

- [components/dashboard/app-sidebar.tsx](/Users/andreneves/Code/evento/evento-client/components/dashboard/app-sidebar.tsx)
- [components/dashboard/nav-main.tsx](/Users/andreneves/Code/evento/evento-client/components/dashboard/nav-main.tsx)
- [components/dashboard/nav-user.tsx](/Users/andreneves/Code/evento/evento-client/components/dashboard/nav-user.tsx)

Map the current sidebar icons to appropriate Hugeicons equivalents, with `Wallet` explicitly using `BitcoinEllipse`.

## Layout Behavior

Collapsed icon alignment should be fixed at the shared sidebar button level in [components/ui/sidebar.tsx](/Users/andreneves/Code/evento/evento-client/components/ui/sidebar.tsx), not per icon. The icon-only button state should center its child icon cleanly and remain stable regardless of which Hugeicon is rendered.

Expanded rows should keep the current larger row treatment while rendering the new icon set with the shared wrapper.

## Risks

- Hugeicons may use slightly different viewboxes or optical balance than Lucide, which can make some icons feel off-center without a shared wrapper.
- A package-level swap can introduce import or tree-shaking issues if the wrong entrypoint is used.
- The collapsed rail can look uneven if centering depends on label-spacing classes from the expanded layout.

## Mitigations

- Normalize icon rendering through a shared wrapper instead of raw per-file usage.
- Keep the collapsed centering behavior in the shared sidebar button primitive.
- Validate the final result in both expanded and collapsed sidebar states.

## Testing

- Run a production build after the dependency and icon swap.
- Verify the expanded sidebar visually for icon consistency.
- Verify the collapsed sidebar visually for centered icon-only rows.
- Confirm `Wallet` renders `BitcoinEllipse`.
