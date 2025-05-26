import React, { createContext, useState, useEffect, useContext } from 'react';

type Theme = 'light' | 'dark';

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
  isDarkMode: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<Theme>(() => {
    try {
      // Get saved theme from localStorage
      const savedTheme = localStorage.getItem('theme') as Theme;
      if (savedTheme === 'light' || savedTheme === 'dark') {
        return savedTheme;
      }
      
      // Always default to light theme if no localStorage key is set
      return 'light';
    } catch (error) {
      console.error('Error getting theme from localStorage:', error);
      return 'light'; // Default to light if there's an error
    }
  });

  // Computed property for easy dark mode checking
  const isDarkMode = theme === 'dark';

  // Function to set theme and update localStorage
  const setTheme = (newTheme: Theme) => {
    try {
      setThemeState(newTheme);
      localStorage.setItem('theme', newTheme);
    } catch (error) {
      console.error('Error saving theme to localStorage:', error);
    }
  };

  // Toggle between light and dark mode
  const toggleTheme = () => {
    setTheme(isDarkMode ? 'light' : 'dark');
  };

  // Apply theme class to document element whenever theme changes
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    
    // Dispatch an event so other components can react to theme changes
    window.dispatchEvent(new CustomEvent('themechange', { detail: { theme } }));
  }, [isDarkMode, theme]);

  // Listen for system preference changes - we're turning this off to always default to light
  // The commented code below would listen to system preference changes
  /*
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    const handleChange = (e: MediaQueryListEvent) => {
      // Only update if user hasn't set a preference in localStorage
      if (!localStorage.getItem('theme')) {
        setThemeState(e.matches ? 'dark' : 'light');
      }
    };

    // Add event listener
    mediaQuery.addEventListener('change', handleChange);
    
    return () => {
      mediaQuery.removeEventListener('change', handleChange);
    };
  }, []);
  */

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setTheme, isDarkMode }}>
      {children}
    </ThemeContext.Provider>
  );
};

// Custom hook to use theme context
export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
