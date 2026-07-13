import { Button } from '@/components/ui/button';
import { LucideIcon } from 'lucide-react';

interface CircledIconButtonProps {
  icon: LucideIcon;
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
  className?: string;
  disabled?: boolean;
  ariaLabel?: string;
}

export function CircledIconButton({
  icon: Icon,
  onClick,
  className,
  disabled,
  ariaLabel,
}: CircledIconButtonProps) {
  return (
    <Button
      size='icon'
      variant='outline'
      onClick={onClick}
      disabled={disabled}
      aria-label={ariaLabel}
      className={`rounded-full bg-gray-50 ${className || ''}`}
    >
      <Icon className='!h-[1.25rem] !w-[1.25rem]' />
    </Button>
  );
}
