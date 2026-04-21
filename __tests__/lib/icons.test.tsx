import { Heart } from '@hugeicons/core-free-icons';
import { render, screen } from '@testing-library/react';

import type { AppIconComponent } from '@/lib/icons';
import { createHugeIcon } from '@/lib/icons';
import { navigationIcons } from '@/lib/icons/semantic';

describe('createHugeIcon', () => {
  const TestIcon = createHugeIcon(Heart, { displayName: 'TestIcon' });

  it('defaults to a 2 stroke width', () => {
    const { container } = render(<TestIcon data-testid='icon' />);
    const iconChild = container.querySelector('svg > *');

    expect(iconChild).toHaveAttribute('stroke-width', '2');
  });

  it('lets call sites override stroke width', () => {
    const { container } = render(<TestIcon strokeWidth={2.75} />);
    const iconChild = container.querySelector('svg > *');

    expect(iconChild).toHaveAttribute('stroke-width', '2.75');
  });

  it('passes through size and className to the svg', () => {
    render(<TestIcon data-testid='icon' size={32} className='custom-icon' />);

    const icon = screen.getByTestId('icon');

    expect(icon).toHaveAttribute('width', '32');
    expect(icon).toHaveAttribute('height', '32');
    expect(icon).toHaveClass('custom-icon');
  });

  it('applies fill to icon children for active/toggled states', () => {
    const { container } = render(<TestIcon fill='currentColor' />);
    const iconChild = container.querySelector('svg > *');

    expect(iconChild).toHaveAttribute('fill', 'currentColor');
  });

  it('works as a typed icon value in shared config', () => {
    function IconConsumer({ icon: Icon }: { icon: AppIconComponent }) {
      return <Icon data-testid='typed-icon' />;
    }

    render(<IconConsumer icon={navigationIcons.wallet} />);

    expect(screen.getByTestId('typed-icon')).toBeInTheDocument();
  });
});
