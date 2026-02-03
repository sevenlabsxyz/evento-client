import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';

interface CircleIconButtonProps {
  icon: LucideIcon;
  onClick: () => void;
  disabled?: boolean;
  iconSize?: 'sm' | 'md' | 'lg';
  ariaLabel?: string;
  className?: string;
}

export function CircleIconButton({
  icon: Icon,
  onClick,
  disabled = false,
  iconSize = 'md',
  ariaLabel,
  className,
}: CircleIconButtonProps) {
  const iconSizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-5 w-5',
    lg: 'h-6 w-6',
  };

  return (
    <Button
      size='icon'
      variant='outline'
      onClick={onClick}
      disabled={disabled}
      className={cn('rounded-full bg-gray-50 hover:bg-gray-100', className)}
      aria-label={ariaLabel}
    >
      <Icon className={iconSizeClasses[iconSize]} />
    </Button>
  );
}
