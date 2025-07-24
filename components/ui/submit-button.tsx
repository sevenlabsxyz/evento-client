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
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={`w-full rounded-xl bg-red-500 py-3 font-semibold text-white transition-colors hover:bg-red-600 disabled:cursor-not-allowed disabled:bg-gray-300 disabled:text-gray-500 ${className}`}
    >
      {loading ? 'Loading...' : children}
    </button>
  );
}
