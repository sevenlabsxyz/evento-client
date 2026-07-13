# Sub-event Calendar Polish Design

## Scope

Refine the existing uncommitted sub-event calendar implementation to match Evento's established visual language and fix mobile finger scrolling. Calendar data, date conversion, event routing, list expansion, and the selected multi-day time-grid layout remain unchanged.

## Copy

- Change the section action from `Open calendar` to `View Calendar`.
- Change the overlay title from `Sub-event calendar` to `Sub-Events Calendar`.
- Keep the timezone description in its current `All times in …` format.

## Close Action

- Render exactly one visible close action on desktop and exactly one on mobile.
- Use the same outlined, rounded icon-button component used for the event page's Share and Bookmark actions rather than a standalone X button.
- Extend that shared icon-button component with an accessible-label prop and use `Close` for this action.
- Keep the close action in the overlay's upper-right header position.
- Activating it closes the overlay without navigating or changing calendar state.
- Preserve Escape and backdrop dismissal.
- Keep the new treatment opt-in for this calendar so unrelated dialogs and sheets retain their current close controls.

## Rounding

- Give the desktop dialog a clearly rounded `rounded-3xl` surface, including at responsive breakpoints where the base dialog currently applies a smaller radius.
- Give the mobile full-height drawer rounded top corners instead of forcing square corners.
- Give every scheduled event block `rounded-2xl` corners, matching Evento's card treatment.
- Preserve existing borders, shadows, spacing, event geometry, overlap lanes, and minimum marker heights.

## Mobile Gesture Ownership

The calendar remains in the existing responsive `Modal` abstraction backed by a Vaul drawer on mobile.

- Add an opt-in mobile `handleOnly` capability to `Modal` and enable it only for the calendar.
- Replace the drawer's decorative handle element with Vaul's real handle primitive while preserving its current visual appearance.
- When the calendar is open on mobile, only the visible handle may drag or dismiss the drawer.
- Mark the complete calendar content area, including the scrollable time grid and `Time TBD` section, with Vaul's no-drag attribute.
- Preserve the grid's vertical and horizontal overflow behavior and add explicit native two-axis touch scrolling plus iOS momentum scrolling.
- A finger gesture beginning anywhere in the calendar body scrolls the calendar and never translates the drawer.
- The handle, close button, backdrop, and Escape key remain valid dismissal paths.
- Do not disable drawer dismissibility globally and do not use event-propagation hacks.

## Component Boundaries

- `EventSubEvents` owns only the updated `View Calendar` action copy.
- `SubEventCalendarModal` owns the updated title, calendar-specific rounding, no-drag boundary, touch scrolling styles, and opt-in handle-only request.
- `Modal` exposes opt-in close-control styling and mobile handle-only behavior without changing existing consumers by default.
- `DrawerContent` renders the real Vaul handle primitive.
- `CircledIconButton` gains an accessible-label prop while preserving its current appearance and call sites.
- The base dialog close can be hidden only when `Modal` supplies the calendar's custom action close, preventing duplicate controls.

## Accessibility

- The outlined X control has the accessible name `Close` and remains keyboard reachable with a visible focus state.
- Only one `Close` control is exposed per viewport.
- Existing event-block accessible date/time labels and sub-event-card keyboard behavior remain unchanged.
- The real drawer handle continues to expose the drawer library's expected interaction semantics.

## Validation

Update focused component tests to verify:

- The exact `View Calendar` trigger copy.
- The exact `Sub-Events Calendar` overlay title.
- One outlined rounded `Close` action on desktop and mobile, with successful dismissal.
- `rounded-3xl` on the desktop overlay and rounded top corners on the mobile drawer.
- `rounded-2xl` on scheduled event blocks.
- A real Vaul handle is rendered when the mobile drawer is open.
- The entire calendar content boundary carries `data-vaul-no-drag`.
- The scroll viewport retains two-axis overflow and native touch-scrolling styles.
- Existing calendar routing, `Time TBD`, list expansion, calendar-model utility tests, TypeScript checking, lint, and the full Jest suite remain green.

Because jsdom cannot reproduce native pointer arbitration between Vaul and a touch scroll viewport, final confirmation of finger scrolling requires testing on a touch device or mobile browser. No development server will be started automatically.

## Out of Scope

- Replacing the calendar drawer with `MasterScrollableSheet` or a mobile dialog.
- Changing calendar dates, durations, timezone rules, event colors, or time-grid geometry.
- Changing close controls across unrelated dialogs or sheets.
- Adding new calendar views or editing interactions.
