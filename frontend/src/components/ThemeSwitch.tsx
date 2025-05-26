import React, { useRef, useEffect } from 'react';
import { SunIcon, MoonIcon } from '@heroicons/react/24/outline';
import { useTheme } from '../context/ThemeContext';

interface ThemeSwitchProps {
  isOpen: boolean;
  onClose: () => void;
}

const ThemeSwitch: React.FC<ThemeSwitchProps> = ({ isOpen, onClose }) => {
  const { setTheme, isDarkMode } = useTheme();
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  const handleSetLightTheme = () => {
    setTheme('light');
    document.documentElement.classList.remove('dark');
    localStorage.setItem('theme', 'light');
    onClose();
  };

  const handleSetDarkTheme = () => {
    setTheme('dark');
    document.documentElement.classList.add('dark');
    localStorage.setItem('theme', 'dark');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div 
      ref={dropdownRef}
      className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-md shadow-lg py-1 z-10"
    >
      <div className="px-4 py-2 text-sm text-gray-700 dark:text-gray-200 font-medium border-b border-gray-200 dark:border-gray-700">
        Theme Settings
      </div>
      
      <button
        onClick={handleSetLightTheme}
        className={`flex items-center w-full px-4 py-2 text-sm ${
          !isDarkMode 
            ? 'bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300' 
            : 'text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700'
        }`}
      >
        <SunIcon className="h-4 w-4 mr-2" />
        Light Mode
        {!isDarkMode && (
          <span className="ml-auto">✓</span>
        )}
      </button>
      
      <button
        onClick={handleSetDarkTheme}
        className={`flex items-center w-full px-4 py-2 text-sm ${
          isDarkMode 
            ? 'bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300' 
            : 'text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700'
        }`}
      >
        <MoonIcon className="h-4 w-4 mr-2" />
        Dark Mode
        {isDarkMode && (
          <span className="ml-auto">✓</span>
        )}
      </button>
    </div>
  );
};

export default ThemeSwitch;
