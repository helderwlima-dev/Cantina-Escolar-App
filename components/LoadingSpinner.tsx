import React from 'react';

interface LoadingSpinnerProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ className, size = 'md' }) => {
  let spinnerSize = 'w-5 h-5';
  let borderWidth = 'border-2';

  switch (size) {
    case 'sm':
      spinnerSize = 'w-4 h-4';
      borderWidth = 'border';
      break;
    case 'md':
      spinnerSize = 'w-5 h-5';
      borderWidth = 'border-2';
      break;
    case 'lg':
      spinnerSize = 'w-8 h-8';
      borderWidth = 'border-4';
      break;
  }

  return (
    <div
      className={`animate-spin rounded-full ${spinnerSize} ${borderWidth} border-current border-t-transparent text-indigo-500 ${className}`}
      role="status"
    >
      <span className="sr-only">Loading...</span>
    </div>
  );
};
