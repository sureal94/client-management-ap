import { createContext, useContext, useState, useEffect } from 'react';
import { translations } from './translations';

const I18nContext = createContext();

export const useI18n = () => {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error('useI18n must be used within I18nProvider');
  }
  return context;
};

export const I18nProvider = ({ children }) => {
  const [language, setLanguage] = useState(() => {
    return localStorage.getItem('language') || 'en';
  });

  useEffect(() => {
    localStorage.setItem('language', language);
    document.documentElement.dir = language === 'he' ? 'rtl' : 'ltr';
    document.documentElement.lang = language;
  }, [language]);

  const t = (key) => {
    return translations[language]?.[key] || key;
  };

  const toggleLanguage = () => {
    // Use functional update to ensure we get the current state
    setLanguage((prevLanguage) => {
      const newLanguage = prevLanguage === 'en' ? 'he' : 'en';
      // Force immediate DOM update before React re-renders
      document.documentElement.dir = newLanguage === 'he' ? 'rtl' : 'ltr';
      document.documentElement.lang = newLanguage;
      localStorage.setItem('language', newLanguage);
      // Force a re-render by triggering a custom event
      window.dispatchEvent(new Event('languagechange'));
      return newLanguage;
    });
  };

  return (
    <I18nContext.Provider value={{ language, t, toggleLanguage }}>
      {children}
    </I18nContext.Provider>
  );
};




