import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { FolderIcon, ChartBarIcon, Cog6ToothIcon, CodeBracketIcon } from '@heroicons/react/24/outline';
import ThemeSwitch from './ThemeSwitch';

const Navbar: React.FC = () => {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  return (
    <nav className="bg-gray-800 text-white shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Link to="/" className="flex items-center">
                <CodeBracketIcon className="h-9 w-9 text-blue-500 transform hover:rotate-12 transition-transform duration-300" />
                <span className="ml-2 text-xl font-bold text-white">OpenCodeReview</span>
              </Link>
            </div>
            <div className="hidden md:block">
              <div className="ml-10 flex items-baseline space-x-4">
                <Link
                  to="/"
                  className="px-3 py-2 rounded-md text-sm font-medium text-white hover:bg-gray-700 flex items-center"
                >
                  <FolderIcon className="h-4 w-4 mr-1" />
                  Projects
                </Link>
                <Link
                  to="/dashboard"
                  className="px-3 py-2 rounded-md text-sm font-medium text-gray-300 hover:bg-gray-700 hover:text-white flex items-center"
                >
                  <ChartBarIcon className="h-4 w-4 mr-1" />
                  Dashboard
                </Link>
              </div>
            </div>
          </div>
          <div className="hidden md:block">
            <div className="ml-4 flex items-center md:ml-6">
              {/* Settings dropdown */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setIsSettingsOpen(!isSettingsOpen)}
                  className="p-1 rounded-full text-gray-400 hover:text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-white"
                >
                  <span className="sr-only">Settings</span>
                  <Cog6ToothIcon className="h-6 w-6" />
                </button>
                <ThemeSwitch 
                  isOpen={isSettingsOpen} 
                  onClose={() => setIsSettingsOpen(false)} 
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
