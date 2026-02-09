import React from 'react';
import { AlertType } from '../types';

interface AlertProps {
  message: string;
  type?: AlertType;
  onClose?: () => void;
  className?: string;
}

export const Alert: React.FC<AlertProps> = ({ message, type = 'info', onClose, className }) => {
  let bgColor = '';
  let borderColor = '';
  let textColor = '';

  switch (type) {
    case 'success':
      bgColor = 'bg-green-100';
      borderColor = 'border-green-400';
      textColor = 'text-green-700';
      break;
    case 'error':
      bgColor = 'bg-red-100';
      borderColor = 'border-red-400';
      textColor = 'text-red-700';
      break;
    case 'warning':
      bgColor = 'bg-yellow-100';
      borderColor = 'border-yellow-400';
      textColor = 'text-yellow-700';
      break;
    case 'info':
    default:
      bgColor = 'bg-blue-100';
      borderColor = 'border-blue-400';
      textColor = 'text-blue-700';
      break;
  }

  return (
    <div
      className={`fixed top-4 left-1/2 -translate-x-1/2 z-50 p-4 border ${borderColor} rounded-lg ${bgColor} ${textColor} shadow-lg flex items-center justify-between space-x-4 max-w-sm w-full animate-fade-in-down ${className}`}
      role="alert"
    >
      <span>{message}</span>
      {onClose && (
        <button
          onClick={onClose}
          className={`ml-auto -mx-1.5 -my-1.5 rounded-lg focus:ring-2 p-1.5 inline-flex items-center justify-center h-8 w-8 ${textColor.replace('text-', 'hover:bg-').replace('-700', '-200')}`}
          aria-label="Close"
        >
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd"></path></svg>
        </button>
      )}
    </div>
  );
};
