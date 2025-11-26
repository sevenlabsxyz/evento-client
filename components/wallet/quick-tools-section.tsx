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
    iconBg: 'bg-gray-50',
    iconColor: 'text-gray-600',
  },
  {
    id: 'spend',
    label: 'Spend',
    icon: ShoppingCart,
    iconBg: 'bg-gray-50',
    iconColor: 'text-gray-600',
  },
  {
    id: 'earn',
    label: 'Earn',
    icon: Star,
    iconBg: 'bg-gray-50',
    iconColor: 'text-gray-600',
  },
  {
    id: 'converter',
    label: 'Converter',
    icon: ArrowRightLeft,
    iconBg: 'bg-gray-50',
    iconColor: 'text-gray-600',
  },
];

type QuickToolsSectionProps = {
  onToolClick: (toolId: QuickTool['id']) => void;
};

export function QuickToolsSection({ onToolClick }: QuickToolsSectionProps) {
  return (
    <div className='space-y-3 pb-4 pt-2'>
      <div className='grid grid-cols-4 gap-1'>
        {quickTools.map((tool) => {
          const Icon = tool.icon;
          return (
            <div
              key={tool.id}
              onClick={() => onToolClick(tool.id)}
              className='font-lg flex flex-col items-center justify-center'
            >
              <motion.div
                className={`flex h-14 w-14 items-center justify-center rounded-xl border border-gray-200 ${tool.iconBg} mb-2`}
                whileTap={{ scale: 0.95 }}
                transition={{ type: 'spring', stiffness: 400, damping: 17 }}
              >
                <Icon className={`h-6 w-6 ${tool.iconColor}`} />
              </motion.div>
              <span className='text-sm font-semibold text-gray-500'>{tool.label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
