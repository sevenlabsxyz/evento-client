# Sub-event Card Affordance Design

## Scope

Update the public event page's sub-event cards on every viewport. The previously discussed desktop preview sheet is out of scope.

## Behavior

- Clicking anywhere on a sub-event card continues to navigate to `/e/{subEventId}`.
- The inert trailing ellipsis is replaced with a decorative right chevron.
- The chevron is part of the card's navigation affordance, not a separate button.
- A sub-event title may occupy two lines and then truncates with an ellipsis.

## Component Design

`EventCompactItem` is shared by multiple event lists, so its default presentation remains unchanged. It will accept a contextual presentation option used by `EventSubEvents` to enable the two-line title and chevron. This avoids changing date-group and event-management cards unintentionally.

## Accessibility

The card remains the single interactive navigation target. Removing the nonfunctional ellipsis button avoids a misleading focus target that previously stopped navigation without performing an action. The decorative chevron is hidden from assistive technology.

## Validation

Component tests will verify that the sub-event presentation shows a chevron, omits the menu button, applies a two-line clamp, and preserves navigation. Type checking and the relevant test suite will run without starting a server.
