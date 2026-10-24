import {
  getActiveManageNavItemId,
  getManageBasePath,
  getManageNavSections,
} from '@/components/manage-dashboard/manage-nav';

function itemIds(type: 'rsvp' | 'registration' | 'ticketed', pending?: number) {
  return getManageNavSections(
    { id: 'evt_test123', type, status: 'published' },
    { pendingRegistrations: pending }
  ).flatMap((section) => section.items.map((item) => item.id));
}

describe('getManageNavSections', () => {
  it('keeps every existing management area reachable for RSVP events', () => {
    const ids = itemIds('rsvp');

    expect(ids).toEqual(
      expect.arrayContaining([
        'overview',
        'guests',
        'contributions',
        'crowdfunding',
        'email-blast',
        'reminders',
        'details',
        'sub-events',
        'music',
        'moderation',
        'hosts',
        'security',
      ])
    );
    expect(ids).not.toEqual(
      expect.arrayContaining(['registrations', 'registration-form', 'tickets', 'sales', 'check-in'])
    );
  });

  it('adds registration areas for registration events but not ticketing areas', () => {
    const ids = itemIds('registration');

    expect(ids).toEqual(expect.arrayContaining(['registrations', 'registration-form']));
    expect(ids).not.toContain('tickets');
    expect(ids).not.toContain('sales');
    expect(ids).not.toContain('check-in');
  });

  it('adds tickets, sales and check-in for ticketed events', () => {
    expect(itemIds('ticketed')).toEqual(
      expect.arrayContaining(['registrations', 'registration-form', 'tickets', 'sales', 'check-in'])
    );
  });

  it('badges registrations only when approvals are pending', () => {
    const find = (pending: number) =>
      getManageNavSections(
        { id: 'evt_test123', type: 'registration', status: 'published' },
        { pendingRegistrations: pending }
      )
        .flatMap((section) => section.items)
        .find((item) => item.id === 'registrations');

    expect(find(3)?.badge).toBe(3);
    expect(find(0)?.badge).toBeUndefined();
  });
});

describe('getActiveManageNavItemId', () => {
  const base = getManageBasePath('evt_test123');
  const sections = getManageNavSections({
    id: 'evt_test123',
    type: 'ticketed',
    status: 'published',
  });

  it('matches the overview only on the exact base path', () => {
    expect(getActiveManageNavItemId(sections, base, base)).toBe('overview');
    expect(getActiveManageNavItemId(sections, `${base}/guests`, base)).toBe('guests');
  });

  it('prefers the most specific href for nested registration routes', () => {
    expect(getActiveManageNavItemId(sections, `${base}/registration/submissions`, base)).toBe(
      'registrations'
    );
    expect(getActiveManageNavItemId(sections, `${base}/registration`, base)).toBe(
      'registration-form'
    );
  });
});
