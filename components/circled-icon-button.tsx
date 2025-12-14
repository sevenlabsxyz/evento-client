import { Button } from '@/components/ui/button';
import { LucideIcon } from 'lucide-react';

interface CircledIconButtonProps {
  icon: LucideIcon;
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
  className?: string;
  disabled?: boolean;
}

export function CircledIconButton({
  icon: Icon,
  onClick,
  className,
  disabled,
}: CircledIconButtonProps) {
  return (
    <Button
      size='icon'
      variant='outline'
      onClick={onClick}
      disabled={disabled}
      className={`rounded-full bg-gray-50 ${className || ''}`}
    >
      <Icon className='!h-[1.25rem] !w-[1.25rem]' />
    </Button>
  );
}
