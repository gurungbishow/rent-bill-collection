'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { translations, Language } from '@/lib/translations';
import { formatBsDate, formatCurrencyLocale, toDevanagariDigits } from '@/lib/bsDate';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: typeof translations['en'];
  formatDate: (bsDateStr: string | null | undefined) => string;
  formatMoney: (amount: number | string) => string;
  formatNumber: (val: number | string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>('np'); // Default Nepali

  useEffect(() => {
    const saved = localStorage.getItem('app_language') as Language;
    if (saved && (saved === 'en' || saved === 'np')) {
      setLanguageState(saved);
    }
  }, []);

  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.setAttribute('lang', language);
      if (language === 'np') {
        document.documentElement.classList.add('lang-np');
      } else {
        document.documentElement.classList.remove('lang-np');
      }
    }
  }, [language]);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('app_language', lang);
  };

  const t = translations[language];

  const formatDate = (bsDateStr: string | null | undefined) => {
    return formatBsDate(bsDateStr, language);
  };

  const formatMoney = (amount: number | string) => {
    return formatCurrencyLocale(amount, language);
  };

  const formatNumber = (val: number | string) => {
    if (language === 'np') {
      return toDevanagariDigits(val);
    }
    return String(val);
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, formatDate, formatMoney, formatNumber }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
