import React from 'react';

interface FixedSubmitButtonProps {
  onClick: () => void;
  disabled?: boolean;
  loading?: boolean;
  children: React.ReactNode;
  className?: string;
}

export function FixedSubmitButton({
  onClick,
  disabled = false,
  loading = false,
  children,
  className = '',
}: FixedSubmitButtonProps) {
  return (
    <div className='fixed bottom-0 left-0 right-0 z-50 border-t border-gray-200 bg-white p-4'>
      <div className='mx-auto max-w-full md:max-w-sm'>
        <button
          onClick={onClick}
          disabled={disabled || loading}
          className={`w-full rounded-xl bg-red-500 py-3 font-semibold text-white transition-colors hover:bg-red-600 disabled:cursor-not-allowed disabled:bg-gray-300 disabled:text-gray-500 ${className}`}
        >
          {loading ? 'Loading...' : children}
        </button>
      </div>
    </div>
  );
}