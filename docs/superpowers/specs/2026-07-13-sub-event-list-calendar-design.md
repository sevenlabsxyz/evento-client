# Sub-event List and Calendar Design

## Scope

Improve the public event page's sub-event section without changing how a sub-event page is opened. The section will become easier to scan, initially show only four cards, and offer a responsive calendar overlay for quickly understanding the sub-event schedule.

The previously discussed desktop event-preview sheet remains out of scope. Clicking a sub-event card or calendar block continues to navigate to `/e/{subEventId}`.

## Sub-event Section

### Header actions

- Keep `Sub Events` on the left.
- Put actions in a compact group on the right so they wrap or shrink cleanly on narrow screens.
- Show `Open calendar` when the loaded list contains at least one sub-event with a valid start date and start time.
- Continue showing the existing host-only add/manage button. When both actions are available, `Open calendar` appears before the add button.
- Do not show the calendar action while the list is loading, after an error, when the list is empty, or when every sub-event lacks a valid start time.

### Collapsed list

- When there are four or fewer sub-events, render the complete list with no fade or expansion control.
- When there are more than four, initially render the first four in the order provided by the existing event query.
- Overlay a clear bottom fade over the end of the collapsed list. The fade is decorative, does not intercept pointer input, and visually indicates that more items are available.
- Place a full-width `View all` button beneath the fade, following the existing event-description `Read more` treatment.
- Activating `View all` renders every sub-event, removes the fade, and changes the control to `Show less`.
- Activating `Show less` restores the first four cards. The section itself remains in place; no forced scroll behavior is added.

### Card content

The existing `sub-event` presentation of `EventCompactItem` remains the scoped variant for this section. In that variant:

- Keep the cover image, two-line title clamp, date, time, and trailing chevron.
- Remove the location and creator/host avatar and username because those details are implied by the parent event.
- Preserve whole-card navigation to `/e/{subEventId}` on mobile, tablet, and desktop.

Other uses of `EventCompactItem` retain their current location, creator, menu, pinning, and one-line-title behavior.

## Calendar Overlay

### Container and responsive behavior

Use the repository's responsive `Modal` abstraction:

- Desktop renders a wide centered dialog.
- Mobile renders a full-height drawer/sheet.
- The same time-grid component is used in both containers.
- On narrow screens, date columns scroll horizontally while the time axis and event geometry remain readable. Opening or dismissing the overlay does not navigate away from the parent event.
- The overlay has an accessible title, a visible close affordance supplied by the modal primitive, and standard escape/outside-dismiss behavior.

### Calendar structure

- Render one chronological column per date represented by a scheduled sub-event.
- Render a vertical time axis covering the earliest relevant start through the latest relevant end, rounded outward to whole-hour boundaries.
- Position each event block by start time and size its height using its actual start-to-end duration.
- Enforce a small minimum visual height for extremely short events so the title remains discoverable, without changing the displayed time range.
- Label each block with the event title and its start/end time when space permits. Truncated labels may use an ellipsis and retain the full title as accessible text.
- Use the parent event's timezone as the single display timezone. Convert every sub-event start and end into that timezone before assigning its date column or vertical position, and show the timezone in the calendar header.
- If a scheduled event crosses midnight in the parent timezone, split its visual block at the date boundary and continue it in the following date column. Both segments navigate to the same event.
- If scheduled events overlap, place them side-by-side within the same date column so neither completely obscures the other.

### Date integrity and incomplete events

- A scheduled event requires a valid start date plus non-null, valid start hour and minute values. Midnight (`00:00`) is valid and must not be treated as missing.
- Use the event's end timestamp for actual duration when it is valid and later than the start.
- If an event has a valid start time but no valid later end, render a minimum-height marker at its start rather than inventing a duration.
- Sub-events without a valid start time do not create calendar columns or affect the time range. If at least one scheduled event exists, list all unscheduled sub-events in a `Time TBD` area below the grid.
- The calendar action remains available as long as at least one scheduled sub-event exists.
- Derive sorted/grouped calendar data from copies so the query-provided sub-event array is never mutated.

### Calendar navigation

- Clicking or tapping any event block or `Time TBD` row closes the overlay and routes to `/e/{subEventId}`.
- Calendar entries use a single interactive target per event segment/row and expose an accessible label containing the event title and displayed time state.

## Component Boundaries

- `EventSubEvents` owns section expansion state, calendar open state, header action visibility, and routing callbacks.
- `EventCompactItem` owns the scoped visual differences for `variant='sub-event'`.
- A dedicated calendar component owns timezone conversion, grouping, overlap layout, cross-midnight segmentation, and responsive time-grid rendering. It receives the parent timezone and the already loaded sub-event array rather than fetching independently.
- `app/e/[id]/page-client.tsx` passes the parent event timezone into `EventSubEvents`.
- Shared date/time helpers should be extracted only where doing so makes conversion and validation independently testable; unrelated date formatting remains unchanged.

## Loading and Error Behavior

- Preserve the current sub-event skeleton while loading.
- Preserve the current behavior of hiding the section on a sub-event query error.
- Preserve the empty-state card when no sub-events exist.
- Expansion and calendar controls are based only on successfully loaded data.

## Accessibility

- `View all`, `Show less`, `Open calendar`, close, and host manage actions are real buttons with visible focus states.
- The list fade is `aria-hidden` and pointer-transparent.
- The decorative card chevron remains hidden from assistive technology.
- The calendar is keyboard dismissible, event blocks are keyboard reachable, and date/time information is available in accessible labels rather than only through geometry or color.
- Color is not the only indicator of overlapping events or `Time TBD` status.

## Validation

Add focused component and utility tests covering:

- Four or fewer cards show fully without expansion controls.
- More than four cards initially show exactly four, with the fade and `View all`; expansion and collapse work.
- The sub-event card variant omits location and creator details while default cards remain unchanged.
- `Open calendar` appears only when at least one valid timed sub-event exists, including midnight as valid.
- The host manage action coexists with the calendar action.
- Calendar grouping uses the parent timezone and does not mutate input order.
- Actual-duration sizing, invalid/missing-end fallback, cross-midnight segmentation, and overlap lanes are deterministic.
- Unscheduled events appear under `Time TBD` when the calendar is otherwise available.
- Calendar entry activation closes the overlay and routes to the selected event.
- Relevant component tests, date/calendar utility tests, TypeScript checking, and the broader existing test suite pass without starting a local HTTP server.

## Out of Scope

- Embedding the full sub-event detail page in a desktop sheet.
- Editing sub-event dates or durations from the calendar.
- Dragging, resizing, switching to month/week views, or persisting a selected calendar view.
- Fetching additional sub-events from within the calendar overlay.
