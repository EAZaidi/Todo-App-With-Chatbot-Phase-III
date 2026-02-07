'use client';

import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';
import { translations, type Language } from '@/lib/i18n/translations';

interface LanguageContextType {
  language: Language;
  toggleLanguage: () => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType>({
  language: 'en',
  toggleLanguage: () => {},
  t: (key: string) => key,
});

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<Language>('en');

  useEffect(() => {
    const stored = localStorage.getItem('language') as Language | null;
    if (stored && (stored === 'en' || stored === 'ur')) {
      setLanguage(stored);
      document.documentElement.lang = stored;
      document.documentElement.dir = stored === 'ur' ? 'rtl' : 'ltr';
    }
  }, []);

  const toggleLanguage = useCallback(() => {
    setLanguage(prev => {
      const next = prev === 'en' ? 'ur' : 'en';
      localStorage.setItem('language', next);
      document.documentElement.lang = next;
      document.documentElement.dir = next === 'ur' ? 'rtl' : 'ltr';
      return next;
    });
  }, []);

  const t = useCallback((key: string): string => {
    return translations[language][key] || translations['en'][key] || key;
  }, [language]);

  return (
    <LanguageContext.Provider value={{ language, toggleLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}
