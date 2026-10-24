'use client';

import { useInView, useMotionValue, useSpring } from 'framer-motion';
import { useLocale } from 'next-intl';
import { ComponentPropsWithoutRef, useEffect, useRef } from 'react';

import { getIntlLocale } from '@/lib/i18n/active-locale';
import { cn } from '@/lib/utils';

interface NumberTickerProps extends ComponentPropsWithoutRef<'span'> {
  value: number;
  startValue?: number;
  direction?: 'up' | 'down';
  delay?: number;
  decimalPlaces?: number;
}

export function NumberTicker({
  value,
  startValue = 0,
  direction = 'up',
  delay = 0,
  className,
  decimalPlaces = 0,
  ...props
}: NumberTickerProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const intlLocale = getIntlLocale(useLocale());
  const motionValue = useMotionValue(direction === 'down' ? value : startValue);
  const springValue = useSpring(motionValue, {
    damping: 60,
    stiffness: 100,
  });
  const isInView = useInView(ref, { once: true, margin: '0px' });

  useEffect(() => {
    if (isInView) {
      const timer = setTimeout(() => {
        motionValue.set(direction === 'down' ? startValue : value);
      }, delay * 1000);
      return () => clearTimeout(timer);
    }
  }, [motionValue, isInView, delay, value, direction, startValue]);

  useEffect(
    () =>
      springValue.on('change', (latest) => {
        if (ref.current) {
          ref.current.textContent = Intl.NumberFormat(intlLocale, {
            minimumFractionDigits: decimalPlaces,
            maximumFractionDigits: decimalPlaces,
          }).format(Number(latest.toFixed(decimalPlaces)));
        }
      }),
    [springValue, decimalPlaces, intlLocale]
  );

  return (
    <span
      ref={ref}
      className={cn(
        'inline-block tabular-nums tracking-wider text-black dark:text-neutral-100',
        className
      )}
      {...props}
    >
      {startValue}
    </span>
  );
}
