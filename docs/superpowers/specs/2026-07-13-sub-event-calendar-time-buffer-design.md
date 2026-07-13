# Sub-Event Calendar Time Buffer Design

## Goal

Give the sub-event calendar useful breathing room around scheduled events. The visible time grid should not begin directly at the first event or end directly after the last event.

## Time Range

- Start the grid five hours before the earliest scheduled event's start time.
- End the grid five hours after the latest scheduled event's actual end time.
- Round the start down to a whole hour and the end up to a whole hour before applying the buffer.
- Clamp the visible range to the current calendar day: never start before `12:00 AM` and never end after midnight.
- Continue treating a missing, invalid, or non-later end time as the existing minimum-height marker. Its layout end determines the latest occupied time before the five-hour buffer is applied.
- Preserve the existing full-day range for cross-midnight events whose segments already reach both midnight boundaries.

## Scope

The range calculation remains inside `buildSubEventCalendar`. The calendar component continues consuming `startHour` and `endHour` without new props or rendering branches. Timezone conversion, date columns, overlap lanes, event durations, routing, modal behavior, and mobile scrolling remain unchanged.

## Validation

Utility tests will cover:

- a normal schedule receiving five hours before and after;
- an early schedule clamping the morning buffer at midnight;
- a late schedule clamping the evening buffer at midnight;
- missing or invalid event ends retaining their minimum marker before the buffer;
- cross-midnight schedules retaining the full-day range.

TypeScript, formatting, lint, focused calendar tests, and the full Jest suite must remain green. No local HTTP server is required.
