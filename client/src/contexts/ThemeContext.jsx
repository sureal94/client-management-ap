import { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext();

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
};

export const ThemeProvider = ({ children }) => {
  // Initialize theme from localStorage or default to 'light'
  // Apply theme IMMEDIATELY (synchronously) before React renders
  const getInitialTheme = () => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark' || savedTheme === 'light') {
      return savedTheme;
    }
    // Check if user profile has darkMode preference
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    if (user.darkMode === true) {
      return 'dark';
    }
    return 'light';
  };

  const initialTheme = getInitialTheme();
  
  // Apply theme IMMEDIATELY to document before React renders
  const root = document.documentElement;
  if (initialTheme === 'dark') {
    root.classList.add('dark');
  } else {
    root.classList.remove('dark');
  }

  const [theme, setTheme] = useState(initialTheme);

  // Apply theme to document whenever theme changes
  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  // Listen for theme changes from other components
  useEffect(() => {
    const handleThemeChange = (e) => {
      if (e.detail && (e.detail.theme === 'dark' || e.detail.theme === 'light')) {
        setTheme(e.detail.theme);
      }
    };
    window.addEventListener('themechange', handleThemeChange);
    return () => window.removeEventListener('themechange', handleThemeChange);
  }, []);

  // Listen for user updates to sync theme (only on initial load, not on every user update)
  useEffect(() => {
    // Only sync on mount, not on every user update to avoid overriding manual changes
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    if (user.darkMode !== undefined && theme === 'light' && user.darkMode === true) {
      // Only sync if theme is light but user wants dark (initial sync)
      setTheme('dark');
    } else if (user.darkMode !== undefined && theme === 'dark' && user.darkMode === false) {
      // Only sync if theme is dark but user wants light (initial sync)
      setTheme('light');
    }
  }, []); // Only run on mount

  const toggleTheme = () => {
    setTheme((prevTheme) => {
      const newTheme = prevTheme === 'dark' ? 'light' : 'dark';
      // Apply immediately to DOM
      const root = document.documentElement;
      if (newTheme === 'dark') {
        root.classList.add('dark');
      } else {
        root.classList.remove('dark');
      }
      localStorage.setItem('theme', newTheme);
      // Dispatch custom event for other components
      window.dispatchEvent(new CustomEvent('themechange', { detail: { theme: newTheme } }));
      return newTheme;
    });
  };

  const setDarkMode = (isDark) => {
    const newTheme = isDark ? 'dark' : 'light';
    // Apply immediately to DOM before state update
    const root = document.documentElement;
    if (newTheme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem('theme', newTheme);
    // Update state
    setTheme(newTheme);
    window.dispatchEvent(new CustomEvent('themechange', { detail: { theme: newTheme } }));
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setDarkMode, isDark: theme === 'dark' }}>
      {children}
    </ThemeContext.Provider>
  );
};

