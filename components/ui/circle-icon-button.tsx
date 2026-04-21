import { Button } from '@/components/ui/button';
import { AppIconComponent } from '@/lib/icons';
import { cn } from '@/lib/utils';

interface CircleIconButtonProps {
  icon: AppIconComponent;
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
    sm: 'h-5 w-5',
    md: 'h-6 w-6',
    lg: 'h-7 w-7',
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
