import { render, screen, within } from '@testing-library/react';

import SecurityPageClient from '@/app/e/security/page-client';
import {
  SECURITY_CONTACT_EMAIL,
  SECURITY_FACTS,
  SECURITY_SECTIONS,
} from '@/components/security/security-content';

const mockSetTopBarForRoute = jest.fn();

jest.mock('@/lib/stores/topbar-store', () => ({
  useTopBar: () => ({
    applyRouteConfig: jest.fn(),
    setTopBarForRoute: mockSetTopBarForRoute,
    clearRoute: jest.fn(),
  }),
}));

describe('SecurityPageClient', () => {
  beforeEach(() => {
    mockSetTopBarForRoute.mockClear();
  });

  it('hides the desktop top bar in favour of the in-page header', () => {
    render(<SecurityPageClient />);

    expect(mockSetTopBarForRoute).toHaveBeenCalledWith(
      '/e/security',
      expect.objectContaining({ title: 'Security', leftMode: 'menu', desktopHidden: true })
    );
    expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
    expect(screen.getByText(/Last updated/)).toBeInTheDocument();
  });

  it('renders six at-a-glance facts', () => {
    render(<SecurityPageClient />);

    const glance = screen.getByRole('region', { name: 'At a glance' });
    expect(SECURITY_FACTS).toHaveLength(6);
    expect(within(glance).getAllByRole('listitem')).toHaveLength(6);
  });

  it('renders every section with a matching on-page nav link', () => {
    render(<SecurityPageClient />);

    const nav = screen.getByRole('navigation', { name: 'On this page' });
    for (const section of SECURITY_SECTIONS) {
      expect(screen.getByRole('heading', { level: 2, name: section.title })).toBeInTheDocument();
      expect(within(nav).getByRole('link', { name: section.navLabel })).toHaveAttribute(
        'href',
        `#${section.id}`
      );
    }
  });

  it('links to the private disclosure channel', () => {
    render(<SecurityPageClient />);

    const reportLink = screen.getByRole('link', { name: 'Email security report' });
    expect(reportLink.getAttribute('href')).toContain(`mailto:${SECURITY_CONTACT_EMAIL}`);
    expect(screen.getByRole('link', { name: 'Help & Support' })).toHaveAttribute(
      'href',
      '/e/contact'
    );
  });
});
