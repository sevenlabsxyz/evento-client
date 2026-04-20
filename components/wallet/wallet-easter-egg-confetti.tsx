'use client';

import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';

const Confetti = dynamic(() => import('react-confetti'), {
  ssr: false,
});

interface WalletEasterEggConfettiProps {
  celebrationKey: number;
}

const BITCOIN_WINNER_CONFETTI_COLORS = [
  '#F7931A',
  '#FFB347',
  '#FFD166',
  '#FFF3D6',
  '#FFFFFF',
  '#C96B00',
] as const;

export function WalletEasterEggConfetti({ celebrationKey }: WalletEasterEggConfettiProps) {
  const [activeCelebrationKey, setActiveCelebrationKey] = useState<number | null>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  useEffect(() => {
    if (celebrationKey <= 0) {
      return;
    }

    setActiveCelebrationKey(celebrationKey);
  }, [celebrationKey]);

  useEffect(() => {
    const updateDimensions = () => {
      setDimensions({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);

    return () => {
      window.removeEventListener('resize', updateDimensions);
    };
  }, []);

  if (!activeCelebrationKey || dimensions.width === 0 || dimensions.height === 0) {
    return null;
  }

  return (
    <Confetti
      key={activeCelebrationKey}
      width={dimensions.width}
      height={dimensions.height}
      numberOfPieces={700}
      recycle={false}
      gravity={0.22}
      initialVelocityY={{ min: 18, max: 32 }}
      tweenDuration={3600}
      colors={[...BITCOIN_WINNER_CONFETTI_COLORS]}
      className='pointer-events-none !fixed inset-0 z-[100]'
      onConfettiComplete={() => {
        setActiveCelebrationKey((currentKey) =>
          currentKey === activeCelebrationKey ? null : currentKey
        );
      }}
    />
  );
}
