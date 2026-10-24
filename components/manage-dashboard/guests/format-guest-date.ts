const guestDateFormatter = new Intl.DateTimeFormat(undefined, {
  month: 'short',
  day: 'numeric',
  year: 'numeric',
});

/**
 * Formats an RSVP / invite timestamp for the guest list (e.g. "Oct 23, 2026").
 * Returns an empty string for missing or unparseable values.
 */
export function formatGuestDate(isoString: string | null | undefined): string {
  if (!isoString) return '';

  const date = new Date(isoString);
  if (Number.isNaN(date.getTime())) return '';

  return guestDateFormatter.format(date);
}
