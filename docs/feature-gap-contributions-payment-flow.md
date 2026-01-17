# Feature Gap: Contributions & Payment Flow for Attendees

## Status

**Missing from evento-client** - Exists in legacy evento-api frontend

## Priority

**High** - Affects monetization for event hosts

## Description

The legacy frontend allows event hosts to set up contribution/donation options (CashApp, Venmo, PayPal) for their events. When attendees view an event with contributions enabled, they see the suggested amount and can contribute via their preferred payment method as part of the RSVP flow.

Currently, evento-client has the **host-side management page** (`/e/[id]/manage/contributions`) but is missing the **attendee-facing display and payment flow**.

## Scope

### In Scope

- Display contribution amount on event detail page
- Show payment method buttons (CashApp, Venmo, PayPal) during RSVP flow
- Honor system confirmation (user confirms they completed external payment)
- Enable contributions management page in host navigation

### Out of Scope

- Bitcoin Lightning contributions (handled separately via wallet feature)
- Required/mandatory payments (contributions are always optional donations)

## Legacy Implementation Locations

### Host Side (Management)

- `evento-api/components/contribution-settings/index.tsx` - Settings form
- `evento-api/app/(public)/p/[id]/edit/view.tsx` - Edit page integration

### Attendee Side (Display & Payment)

- `evento-api/components/contributions/index.tsx` - Contribution amount display
- `evento-api/components/payment-flow/index.tsx` - Multi-step payment modal
- `evento-api/components/payment-flow/steps/payment-methods.tsx` - Payment method selection
- `evento-api/components/payment-flow/steps/return-confirmation.tsx` - Confirm payment completed
- `evento-api/components/payment-flow/steps/payment-confirmation.tsx` - Final confirmation
- `evento-api/components/payment-flow/steps/success.tsx` - Success screen
- `evento-api/components/rsvp-modal/rsvp-modal.tsx` - RSVP modal that triggers payment flow

## User Flow (Legacy - To Be Replicated)

### Host Flow (Already Exists in evento-client)

1. Host navigates to event management -> Contributions
2. Sets suggested contribution amount (USD)
3. Enables payment methods (CashApp, Venmo, PayPal)
4. Enters their username/handle for each method
5. Saves settings

### Attendee Flow (MISSING - To Be Implemented)

1. Attendee views event page
2. Sees contribution amount displayed near date/time/location info
3. Clicks RSVP button -> RSVP sheet opens
4. Selects "Yes" (going)
5. **If event has contributions enabled:**
    - Payment method selection sheet appears
    - Shows suggested amount and available payment options
    - User taps preferred method (CashApp/Venmo/PayPal)
    - App opens external payment link in browser/app
    - User completes payment externally
    - User returns and confirms "I've completed payment"
    - RSVP is recorded
6. **If event has no contributions:**
    - RSVP is recorded immediately (current behavior)

## Technical Requirements

### 1. Contribution Display Component

Create a component to show contribution amount on event detail page.

**Location:** `components/event-detail/event-contributions.tsx`

**Props:**

```typescript
interface EventContributionsProps {
    cost: number | string | null;
}
```

**Placement:** In `event-info.tsx`, after location display, before action buttons.

**UI:** Simple inline display with dollar icon and formatted amount (e.g., "$25.00 suggested contribution")

### 2. Payment Flow Sheet

Create a multi-step sheet for the payment flow during RSVP.

**Location:** `components/event-detail/contribution-payment-sheet.tsx`

**Steps:**

1. **Payment Methods** - Display available methods with suggested amount
2. **Return Confirmation** - "Did you complete the payment?" (Yes/No)
3. **Success** - Confirmation message

**Payment Method Deep Links:**

```typescript
const generatePaymentLink = (
    method: string,
    username: string,
    amount: number,
    isMobile: boolean
) => {
    const strippedUsername = username.replace(/^[@$]/, '');

    switch (method) {
        case 'cashapp':
            return `https://cash.app/$${strippedUsername}/${amount}`;
        case 'venmo':
            // Mobile: venmo://paycharge?txn=pay&recipients=${username}&amount=${amount}
            // Web fallback: https://account.venmo.com/u/${username}
            return isMobile
                ? `venmo://paycharge?txn=pay&recipients=${strippedUsername}&amount=${amount}&note=Evento`
                : `https://account.venmo.com/u/${strippedUsername}`;
        case 'paypal':
            return `https://www.paypal.com/paypalme/${strippedUsername}/${amount}`;
        default:
            return '';
    }
};
```

### 3. Modify RSVP Sheet

Update `components/event-detail/event-rsvp-sheet.tsx` to:

1. Accept contribution props (cost, payment methods)
2. Check if event has contributions enabled
3. Trigger payment flow sheet when user selects "Yes"
4. Only submit RSVP after payment flow completes (or user skips)

### 4. Update Event Detail Page

Modify `app/e/[id]/page-client.tsx` to:

1. Pass contribution data to EventInfo component
2. Pass contribution data to RsvpSheet component

### 5. Enable Contributions in Manage Navigation

Update `app/e/[id]/manage/page.tsx` to uncomment/enable contributions link:

```typescript
{
  id: "contributions",
  label: "Contributions",
  icon: DollarSign,
  route: `/e/${eventId}/manage/contributions`,
}
```

### 6. Verify Contributions Management Page

Ensure `app/e/[id]/manage/contributions/page.tsx`:

- Loads existing contribution settings correctly
- Saves updates via API
- Shows only CashApp, Venmo, PayPal (remove Bitcoin Lightning option)
- Navigation back to manage page works

## API Integration

The contribution fields already exist in the event API response:

- `cost` - Suggested contribution amount
- `contrib_cashapp` - CashApp username
- `contrib_venmo` - Venmo username
- `contrib_paypal` - PayPal username
- `contrib_btclightning` - (To be ignored/removed from UI)

No new API endpoints needed.

## Acceptance Criteria

### Host Side

- [ ] Contributions link visible in event manage navigation
- [ ] Can set suggested contribution amount
- [ ] Can enable/disable CashApp with username
- [ ] Can enable/disable Venmo with username
- [ ] Can enable/disable PayPal with username
- [ ] Bitcoin Lightning option removed from UI
- [ ] Settings save correctly and persist

### Attendee Side

- [ ] Contribution amount displays on event page (when set)
- [ ] Contribution amount appears near date/time/location
- [ ] RSVP "Yes" triggers payment flow when contributions enabled
- [ ] Payment methods sheet shows enabled methods only
- [ ] CashApp button opens correct deep link with amount
- [ ] Venmo button opens correct deep link with amount
- [ ] PayPal button opens correct deep link with amount
- [ ] User can confirm payment completion
- [ ] User can skip/decline contribution (optional donation)
- [ ] RSVP records correctly after flow completes
- [ ] Events without contributions work normally (no payment flow)

## UI/UX Considerations

- Use existing sheet components (DetachedSheet) for consistency
- Payment method buttons should show brand icons (already exist in `components/icons/`)
- Format currency as USD with 2 decimal places
- "Skip" option should be available (contributions are optional)
- Mobile: Deep links should open native apps when installed
- Desktop: Deep links open web versions

## Dependencies

Already installed:

- Payment method icons (`components/icons/cashapp.tsx`, `venmo.tsx`, `paypal.tsx`)
- DetachedSheet component for modals
- Event API hooks

May need:

- Mobile detection utility for deep link selection

## Files to Create

1. `components/event-detail/event-contributions.tsx` - Contribution amount display
2. `components/event-detail/contribution-payment-sheet.tsx` - Payment flow sheet

## Files to Modify

1. `components/event-detail/event-info.tsx` - Add contribution display
2. `components/event-detail/event-rsvp-sheet.tsx` - Integrate payment flow
3. `app/e/[id]/page-client.tsx` - Pass contribution props
4. `app/e/[id]/manage/page.tsx` - Enable contributions nav link
5. `app/e/[id]/manage/contributions/page.tsx` - Remove Bitcoin option

## Estimated Effort

**Medium-Large** (2-3 days)

- Contribution display component: 2 hours
- Payment flow sheet (3 steps): 4-6 hours
- RSVP sheet integration: 2-3 hours
- Manage page updates: 1-2 hours
- Testing & polish: 4 hours

## Testing Checklist

1. Create event with no contributions -> RSVP works normally
2. Create event with $25 CashApp contribution -> Verify flow
3. Create event with multiple payment methods -> All buttons work
4. Test on mobile -> Deep links open apps
5. Test on desktop -> Links open web versions
6. Skip contribution -> RSVP still records
7. Complete contribution -> RSVP records with confirmation
8. Edit existing event contributions -> Changes persist

## Notes

- Contributions are **always optional** (donations, not required payments)
- Honor system: We don't verify actual payment completion
- Bitcoin Lightning is handled separately via the wallet feature
- Payment links open externally; we don't process payments directly
