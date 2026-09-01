'use client';

import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, User as UserIcon, LogOut, Globe } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/context/LanguageContext';
import { ThemeToggle } from '@/components/ThemeToggle';

export default function RoomLayout({ children }: { children: React.ReactNode }) {
  const { user, isLoading, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const { language, setLanguage, t } = useLanguage();

  const navigation = [
    { name: t.my_room, href: '/room/dashboard', icon: Home },
    { name: t.profile, href: '/room/profile', icon: UserIcon },
  ];

  useEffect(() => {
    if (!isLoading && (!user || user.role !== 'ROOM_USER')) {
      router.replace('/');
    }
  }, [user, isLoading, router]);

  if (isLoading || !user) return <div className="min-h-screen flex items-center justify-center">{t.loading}</div>;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col md:flex-row">
      {/* Desktop Sidebar */}
      <div className="hidden md:flex w-64 flex-col bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800">
        <div className="flex flex-col justify-center h-16 px-6 border-b border-slate-200 dark:border-slate-800">
          <div className="font-bold text-base text-emerald-600 dark:text-emerald-400 leading-tight">
            {t.tenant_portal}
          </div>
          {user && (
            <div className="text-xs font-medium text-slate-500 dark:text-slate-400 truncate mt-0.5">
              {user.name || user.username}
            </div>
          )}
        </div>

        {/* Utilities in Sidebar */}
        <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/70 flex items-center justify-between">
          <ThemeToggle />
          <div className="flex bg-slate-200/80 dark:bg-slate-800 p-0.5 rounded-lg text-xs">
            <button
              onClick={() => setLanguage('np')}
              className={`px-2.5 py-1 rounded-md transition-all font-medium ${
                language === 'np' ? 'bg-white dark:bg-slate-700 text-emerald-700 dark:text-emerald-300 shadow-sm' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              नेपाली
            </button>
            <button
              onClick={() => setLanguage('en')}
              className={`px-2.5 py-1 rounded-md transition-all font-medium ${
                language === 'en' ? 'bg-white dark:bg-slate-700 text-emerald-700 dark:text-emerald-300 shadow-sm' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              EN
            </button>
          </div>
        </div>

        <div className="flex-1 py-4 flex flex-col gap-1 px-3">
          {navigation.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link 
                key={item.href} 
                href={item.href}
                replace
                className={`flex items-center gap-3 px-3 py-2.5 rounded-md transition-colors ${
                  isActive 
                    ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 font-medium' 
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                <item.icon size={20} />
                {item.name}
              </Link>
            )
          })}
        </div>
        <div className="p-4 border-t border-slate-200 dark:border-slate-800">
          <Button 
            variant="outline" 
            className="w-full flex items-center gap-2 justify-center text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-950/40 border-red-200 dark:border-red-900/40" 
            onClick={() => logout()}
          >
            <LogOut size={16} />
            {t.logout}
          </Button>
        </div>
      </div>


      {/* Mobile Topbar */}
      <div className="md:hidden h-13 bg-white/85 dark:bg-slate-900/85 backdrop-blur-xl border-b border-slate-200/60 dark:border-slate-800/60 flex items-center justify-between px-3.5 shrink-0 z-30">
        <div className="flex items-center gap-2 min-w-0">
          <div className="h-8 w-8 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-600 text-white flex items-center justify-center font-bold text-xs shadow-sm flex-shrink-0">
            {user?.name ? user.name.charAt(0).toUpperCase() : 'T'}
          </div>
          <div className="flex flex-col min-w-0">
            <div className="font-black text-sm sm:text-base tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-emerald-600 via-teal-500 to-emerald-500 dark:from-emerald-400 dark:via-teal-300 dark:to-emerald-300 drop-shadow-[0_1px_1px_rgba(0,0,0,0.08)] truncate">
              {t.tenant_portal}
            </div>
            {user && (
              <div className="text-[10px] font-medium text-slate-500 dark:text-slate-400 truncate">
                {user.name || user.username}
              </div>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <ThemeToggle />
          <button
            onClick={() => setLanguage(language === 'np' ? 'en' : 'np')}
            className="flex items-center gap-1 text-[11px] font-bold px-2 py-1 bg-slate-100 dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 rounded-full border border-slate-200/60 dark:border-slate-700/60 active:scale-95 transition-transform"
          >
            <Globe size={12} /> {language === 'np' ? 'नेपाली' : 'EN'}
          </button>
          <Button variant="ghost" size="icon" onClick={() => logout()} className="h-8 w-8 text-slate-500 hover:text-red-600 dark:text-slate-400 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-full">
            <LogOut size={15} />
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto pb-24 md:pb-0 relative z-10">
        {children}
      </main>

      {/* Mobile Floating Glass Bottom Dock */}
      <div className="md:hidden fixed bottom-3 left-3 right-3 h-14 bg-white/85 dark:bg-slate-900/85 backdrop-blur-2xl border border-slate-200/80 dark:border-slate-800/80 rounded-2xl flex items-center justify-around z-30 px-2 shadow-[0_8px_32px_rgba(0,0,0,0.08)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.4)]">
        {navigation.map((item) => {
          const isActive = pathname === item.href;
          return (
             <Link 
               key={item.href} 
               href={item.href}
               replace
               className={`flex flex-col items-center justify-center w-full h-full gap-0.5 transition-all duration-200 active:scale-95 ${
                 isActive ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
               }`}
             >
               <div className={`px-3 py-1 rounded-full transition-all ${isActive ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md shadow-emerald-500/25' : ''}`}>
                 <item.icon size={18} strokeWidth={isActive ? 2.5 : 2} className={isActive ? 'text-white' : ''} />
               </div>
               <span className={`text-[9px] ${isActive ? 'font-bold text-emerald-600 dark:text-emerald-400' : 'font-medium'}`}>{item.name}</span>
             </Link>
          )
        })}
      </div>
    </div>
  );
}
