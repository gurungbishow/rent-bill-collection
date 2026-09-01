'use client';

import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';
import { Moon, Sun, Laptop } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function ThemeToggle() {
  const [mounted, setMounted] = useState(false);
  const { theme, setTheme } = useTheme();

  // useEffect only runs on the client, so now we can safely show the UI
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <Button variant="ghost" size="icon" className="w-8 h-8 rounded-md" disabled>
        <div className="w-4 h-4 bg-slate-200 dark:bg-slate-800 rounded-full animate-pulse" />
      </Button>
    );
  }

  const cycleTheme = () => {
    if (theme === 'light') setTheme('dark');
    else if (theme === 'dark') setTheme('system');
    else setTheme('light');
  };

  return (
    <Button 
      variant="ghost" 
      size="icon" 
      onClick={cycleTheme}
      className="w-8 h-8 rounded-md text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800"
      title={`Current theme: ${theme}. Click to change.`}
    >
      {theme === 'light' ? (
        <Sun size={16} />
      ) : theme === 'dark' ? (
        <Moon size={16} />
      ) : (
        <Laptop size={16} />
      )}
      <span className="sr-only">Toggle theme</span>
    </Button>
  );
}
