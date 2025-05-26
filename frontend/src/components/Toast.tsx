import React, { useEffect, useState } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';

export interface ToastProps {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
  duration?: number;
  onClose: (id: string) => void;
}

const Toast: React.FC<ToastProps> = ({ id, message, type, duration = 5000, onClose }) => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(() => onClose(id), 300); // Give time for animation
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose, id]);

  const getTypeStyles = () => {
    switch (type) {
      case 'success':
        return 'bg-green-50 text-green-800 dark:bg-green-900/20 dark:text-green-300 border-green-500';
      case 'error':
        return 'bg-red-50 text-red-800 dark:bg-red-900/20 dark:text-red-300 border-red-500';
      case 'warning':
        return 'bg-yellow-50 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300 border-yellow-500';
      case 'info':
      default:
        return 'bg-blue-50 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300 border-blue-500';
    }
  };

  const getIcon = () => {
    switch (type) {
      case 'success':
        return (
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path>
          </svg>
        );
      case 'error':
        return (
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd"></path>
          </svg>
        );
      case 'warning':
        return (
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.995 8.995a.75.75 0 01.5-.25h1.01a.75.75 0 01.5.25.75.75 0 01.25.5v4.01a.75.75 0 01-.25.5.75.75 0 01-.5.25H9.495a.75.75 0 01-.5-.25.75.75 0 01-.25-.5V9.495a.75.75 0 01.25-.5zm1.01-3.5a1 1 0 100 2 1 1 0 000-2z" clipRule="evenodd"></path>
          </svg>
        );
      case 'info':
      default:
        return (
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clipRule="evenodd"></path>
          </svg>
        );
    }
  };

  return (
    <div
      className={`max-w-xs bg-white dark:bg-gray-800 border-l-4 ${getTypeStyles()} shadow-md rounded-lg pointer-events-auto flex transform transition-all duration-300 ease-in-out ${
        isVisible ? 'translate-y-0 opacity-100' : 'translate-y-2 opacity-0'
      }`}
      role="alert"
    >
      <div className="flex p-4">
        <div className="flex-shrink-0">{getIcon()}</div>
        <div className="ml-3">
          <p className="text-sm font-medium">{message}</p>
        </div>
        <div className="ml-auto pl-3">
          <div className="-mx-1.5 -my-1.5">
            <button
              type="button"
              className="inline-flex bg-transparent rounded-md p-1.5 focus:outline-none focus:ring-2 focus:ring-offset-2"
              onClick={() => {
                setIsVisible(false);
                setTimeout(() => onClose(id), 300);
              }}
              aria-label="Close"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Toast;
