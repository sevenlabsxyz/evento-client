import { useTranslations } from 'next-intl';
import React from 'react';

interface SubmitButtonProps {
  onClick: () => void;
  disabled?: boolean;
  loading?: boolean;
  children: React.ReactNode;
  className?: string;
  type?: 'button' | 'submit' | 'reset';
}

export function SubmitButton({
  onClick,
  disabled = false,
  loading = false,
  children,
  className = '',
  type = 'button',
}: SubmitButtonProps) {
  const t = useTranslations('zap.ui');
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={`w-full rounded-full bg-red-500 py-3 font-semibold text-white transition-colors hover:bg-red-600 disabled:cursor-not-allowed disabled:bg-gray-300 disabled:text-gray-500 dark:disabled:bg-neutral-600 dark:disabled:text-neutral-300 ${className}`}
    >
      {loading ? t('loading') : children}
    </button>
  );
}
