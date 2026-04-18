import { Button } from '@/components/ui/button';
import { LucideIcon } from 'lucide-react';

interface CircledIconButtonProps {
  icon: LucideIcon;
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
  className?: string;
  disabled?: boolean;
  iconClassName?: string;
}

export function CircledIconButton({
  icon: Icon,
  onClick,
  className,
  disabled,
  iconClassName,
}: CircledIconButtonProps) {
  return (
    <Button
      size='icon'
      variant='outline'
      onClick={onClick}
      disabled={disabled}
      className={`rounded-full bg-gray-50 ${className || ''}`}
    >
      <Icon className={`!h-[1.25rem] !w-[1.25rem] ${iconClassName ?? ''}`} />
    </Button>
  );
}
