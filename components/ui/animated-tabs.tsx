'use client';

import { cn } from '@/lib/utils';
import { AnimatePresence, motion, type Transition } from 'framer-motion';
import { LucideIcon } from 'lucide-react';
import * as React from 'react';

interface Tab {
  title: string;
  icon: LucideIcon;
  onClick?: () => void;
  type?: never;
}

interface Separator {
  type: 'separator';
  title?: never;
  icon?: never;
}

type TabItem = Tab | Separator;

interface AnimatedTabsProps {
  tabs: TabItem[];
  className?: string;
  activeColor?: string;
  defaultSelected?: number;
  selected?: number | null;
  onChange?: (index: number | null) => void;
  expanded?: boolean;
}

const collapsedButtonVariants = {
  initial: {
    gap: 0,
    paddingLeft: '.5rem',
    paddingRight: '.5rem',
  },
  animate: (isSelected: boolean) => ({
    gap: isSelected ? '.5rem' : 0,
    paddingLeft: isSelected ? '1rem' : '.5rem',
    paddingRight: isSelected ? '1rem' : '.5rem',
  }),
};

const expandedButtonVariants = {
  initial: {
    gap: '.5rem',
    paddingLeft: '1rem',
    paddingRight: '1rem',
  },
  animate: {
    gap: '.5rem',
    paddingLeft: '1rem',
    paddingRight: '1rem',
  },
};

const spanVariants = {
  initial: { width: 0, opacity: 0 },
  animate: { width: 'auto', opacity: 1 },
  exit: { width: 0, opacity: 0 },
};

const transition: Transition = { delay: 0.1, type: 'spring', bounce: 0, duration: 0.6 };

export function AnimatedTabs({
  tabs,
  className,
  activeColor = 'text-primary',
  defaultSelected,
  selected: controlledSelected,
  onChange,
  expanded = false,
}: AnimatedTabsProps) {
  const [internalSelected, setInternalSelected] = React.useState<number | null>(
    defaultSelected ?? null
  );
  const selected = controlledSelected !== undefined ? controlledSelected : internalSelected;

  const handleSelect = (index: number) => {
    if (controlledSelected === undefined) {
      setInternalSelected(index);
    }
    onChange?.(index);
  };

  const Separator = () => <div className='mx-1 h-[24px] w-[1.2px] bg-border' aria-hidden='true' />;

  return (
    <div
      className={cn(
        'flex w-fit items-center gap-2 rounded-full border bg-background p-1 shadow-sm',
        className
      )}
    >
      {tabs.map((tab, index) => {
        if (tab.type === 'separator') {
          return <Separator key={`separator-${index}`} />;
        }

        const Icon = tab.icon;
        return (
          <motion.button
            key={tab.title}
            variants={expanded ? expandedButtonVariants : collapsedButtonVariants}
            initial={false}
            animate='animate'
            custom={selected === index}
            onClick={() => {
              handleSelect(index);
              tab.onClick?.();
            }}
            transition={transition}
            className={cn(
              'relative flex items-center rounded-full px-4 py-2 text-sm font-medium transition-colors duration-300',
              selected === index
                ? cn('bg-muted', activeColor)
                : 'text-muted-foreground hover:bg-muted hover:text-foreground'
            )}
          >
            <Icon size={20} />
            {expanded ? (
              <span className='whitespace-nowrap'>{tab.title}</span>
            ) : (
              <AnimatePresence initial={false}>
                {selected === index && (
                  <motion.span
                    variants={spanVariants}
                    initial='initial'
                    animate='animate'
                    exit='exit'
                    transition={transition}
                    className='overflow-hidden whitespace-nowrap'
                  >
                    {tab.title}
                  </motion.span>
                )}
              </AnimatePresence>
            )}
          </motion.button>
        );
      })}
    </div>
  );
}

export default AnimatedTabs;
