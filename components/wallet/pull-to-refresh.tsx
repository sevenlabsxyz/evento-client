'use client';

import { useIsMobile } from '@/hooks/use-mobile';
import { Loader2 } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

interface PullToRefreshProps {
  onRefresh: () => Promise<void>;
  children: React.ReactNode;
  className?: string;
}

export function PullToRefresh({ onRefresh, children, className }: PullToRefreshProps) {
  const isMobile = useIsMobile();
  const containerRef = useRef<HTMLDivElement>(null);
  const [isPulling, setIsPulling] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const isRefreshingRef = useRef(isRefreshing);
  const pullDistanceRef = useRef(pullDistance);

  // Keep refs in sync with state so event handlers always read latest values
  isRefreshingRef.current = isRefreshing;
  pullDistanceRef.current = pullDistance;

  useEffect(() => {
    const el = containerRef.current;
    if (!el || !isMobile) return;

    let isDragging = false;
    let startY = 0;

    const onTouchStart = (e: TouchEvent) => {
      if (el.scrollTop > 1 || isRefreshingRef.current) return;
      startY = e.touches[0].clientY;
      isDragging = true;
    };

    const onTouchMove = (e: TouchEvent) => {
      if (!isDragging || isRefreshingRef.current) return;
      if (el.scrollTop > 1) {
        isDragging = false;
        setIsPulling(false);
        setPullDistance(0);
        return;
      }

      const diff = e.touches[0].clientY - startY;
      if (diff > 0) {
        e.preventDefault();
        const dampened = Math.min(diff * 0.5, 100);
        setPullDistance(dampened);
        setIsPulling(true);
      }
    };

    const onTouchEnd = async () => {
      if (!isDragging) return;
      isDragging = false;

      if (pullDistanceRef.current > 60) {
        setIsRefreshing(true);
        isRefreshingRef.current = true;
        setPullDistance(60);
        try {
          await onRefresh();
        } catch {
          // Silently ignore refresh errors — the user only wants a spinner
        }
        setIsRefreshing(false);
        isRefreshingRef.current = false;
      }

      setIsPulling(false);
      setPullDistance(0);
    };

    el.addEventListener('touchstart', onTouchStart, { passive: true });
    el.addEventListener('touchmove', onTouchMove, { passive: false });
    el.addEventListener('touchend', onTouchEnd, { passive: true });

    return () => {
      el.removeEventListener('touchstart', onTouchStart);
      el.removeEventListener('touchmove', onTouchMove);
      el.removeEventListener('touchend', onTouchEnd);
    };
  }, [isMobile, onRefresh]);

  // On desktop / SSR, render children directly (no wrapper)
  if (!isMobile) {
    return <div className={className}>{children}</div>;
  }

  return (
    <div
      ref={containerRef}
      className={`relative overflow-y-auto overscroll-y-contain ${className || ''}`}
    >
      {/* Pull indicator */}
      <div
        className="pointer-events-none absolute inset-x-0 top-0 z-10 flex items-center justify-center overflow-hidden bg-white"
        style={{
          height: `${pullDistance}px`,
          opacity: pullDistance > 5 ? 1 : 0,
          transition: isPulling ? 'none' : 'all 0.25s ease-out',
        }}
      >
        <Loader2
          className={`h-6 w-6 text-gray-400 ${isRefreshing ? 'animate-spin' : ''}`}
          style={{
            transform: `rotate(${Math.min(pullDistance * 3, 360)}deg)`,
          }}
        />
      </div>

      {/* Content pushed down by pull distance */}
      <div
        style={{
          paddingTop: `${pullDistance}px`,
          transition: isPulling ? 'none' : 'padding-top 0.25s ease-out',
        }}
      >
        {children}
      </div>
    </div>
  );
}
