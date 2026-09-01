'use client';

import { useLanguage } from '@/context/LanguageContext';
import { Button } from '@/components/ui/button';
import { Languages } from 'lucide-react';
import { useEffect, useState } from 'react';

export function LanguageToggle() {
  const { language, setLanguage } = useLanguage();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <Button variant="ghost" size="icon" className="w-8 h-8 rounded-md" disabled>
        <Languages size={16} className="text-slate-400" />
      </Button>
    );
  }

  const toggleLanguage = () => {
    setLanguage(language === 'en' ? 'np' : 'en');
  };

  return (
    <Button 
      variant="ghost" 
      size="icon" 
      onClick={toggleLanguage}
      className="w-8 h-8 rounded-md text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 flex items-center justify-center font-medium"
      title={`Current language: ${language.toUpperCase()}. Click to change.`}
    >
      {language === 'en' ? 'NP' : 'EN'}
      <span className="sr-only">Toggle language</span>
    </Button>
  );
}
