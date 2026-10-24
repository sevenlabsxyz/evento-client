import { motion } from 'framer-motion';
import { ArrowRightLeft, Bitcoin, ShoppingCart, Star } from 'lucide-react';

type QuickTool = {
  id: 'converter' | 'buy-sell' | 'spend' | 'earn';
  label: string;
  icon: React.ElementType;
  iconBg: string;
  iconColor: string;
};

const quickTools: QuickTool[] = [
  {
    id: 'buy-sell',
    label: 'Buy / Sell',
    icon: Bitcoin,
    iconBg: 'bg-gray-50 dark:bg-neutral-950',
    iconColor: 'text-gray-600 dark:text-neutral-400',
  },
  {
    id: 'spend',
    label: 'Spend',
    icon: ShoppingCart,
    iconBg: 'bg-gray-50 dark:bg-neutral-950',
    iconColor: 'text-gray-600 dark:text-neutral-400',
  },
  {
    id: 'earn',
    label: 'Earn',
    icon: Star,
    iconBg: 'bg-gray-50 dark:bg-neutral-950',
    iconColor: 'text-gray-600 dark:text-neutral-400',
  },
  {
    id: 'converter',
    label: 'Converter',
    icon: ArrowRightLeft,
    iconBg: 'bg-gray-50 dark:bg-neutral-950',
    iconColor: 'text-gray-600 dark:text-neutral-400',
  },
];

type QuickToolsSectionProps = {
  onToolClick: (toolId: QuickTool['id']) => void;
  buySellLabel?: string;
};

export function QuickToolsSection({
  onToolClick,
  buySellLabel = 'Buy / Sell',
}: QuickToolsSectionProps) {
  return (
    <div className='space-y-3 pb-4 pt-2 md:pb-0'>
      <div className='grid grid-cols-4 gap-1'>
        {quickTools.map((tool) => {
          const Icon = tool.icon;
          const label = tool.id === 'buy-sell' ? buySellLabel : tool.label;

          return (
            <div
              key={tool.id}
              onClick={() => onToolClick(tool.id)}
              className='font-lg flex flex-col items-center justify-center md:cursor-pointer'
            >
              <motion.div
                className={`flex h-14 w-14 items-center justify-center rounded-full border border-gray-200 shadow-sm hover:bg-gray-100 dark:border-neutral-800 dark:hover:bg-neutral-800 ${tool.iconBg} mb-2`}
                whileTap={{ scale: 0.95 }}
                transition={{ type: 'spring', stiffness: 400, damping: 17 }}
              >
                <Icon className={`h-6 w-6 ${tool.iconColor}`} />
              </motion.div>
              <span className='text-center text-sm font-semibold text-gray-500 dark:text-neutral-400'>
                {label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
