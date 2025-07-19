import { Toggle } from '@/components/ui/toggle';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import type { TooltipContentProps } from '@radix-ui/react-tooltip';
import { forwardRef } from 'react';

interface ToolbarButtonProps extends React.ComponentPropsWithoutRef<typeof Toggle> {
  isActive?: boolean;
  tooltip?: string;
  tooltipOptions?: TooltipContentProps;
}

const ToolbarButton = forwardRef<HTMLButtonElement, ToolbarButtonProps>(function ToolbarButton(
  { isActive, children, tooltip, className, tooltipOptions, ...props },
  ref
) {
  return (
    <TooltipProvider delayDuration={0}>
      <Tooltip>
        <TooltipTrigger asChild>
          <Toggle
            size='sm'
            pressed={isActive}
            {...props}
            ref={ref}
            className={cn(
              'rounded disabled:pointer-events-auto disabled:cursor-not-allowed disabled:text-muted-foreground disabled:hover:bg-transparent',
              {
                'bg-red-100 text-red-600 hover:bg-red-100 hover:text-red-600': isActive,
                'hover:bg-gray-100': !isActive,
              },
              className
            )}
          >
            {children}
          </Toggle>
        </TooltipTrigger>
        {tooltip && (
          <TooltipContent {...tooltipOptions}>
            <div className='flex flex-col items-center text-center'>{tooltip}</div>
          </TooltipContent>
        )}
      </Tooltip>
    </TooltipProvider>
  );
});

ToolbarButton.displayName = 'ToolbarButton';

export { ToolbarButton };
