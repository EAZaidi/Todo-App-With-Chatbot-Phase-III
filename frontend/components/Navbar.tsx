'use client';

import { useState, useRef, useEffect } from 'react';
import { Poppins } from 'next/font/google';
import { useAuth } from './auth/AuthProvider';
import { useTheme } from './ThemeProvider';
import { useLanguage } from './LanguageProvider';
import { LogOut, User, ChevronDown, Sparkles, Sun, Moon, Languages } from 'lucide-react';

const poppins = Poppins({ subsets: ['latin'], weight: ['700'] });

export function Navbar() {
  const { user, signOut, isLoading } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { language, toggleLanguage, t } = useLanguage();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSignOut = async () => {
    setIsSigningOut(true);
    try {
      await signOut();
      window.location.href = '/';
    } catch {
      setIsSigningOut(false);
    }
  };

  const userInitial = user?.name
    ? user.name.charAt(0).toUpperCase()
    : user?.email
    ? user.email.charAt(0).toUpperCase()
    : '?';

  const displayName = user?.name || user?.email?.split('@')[0] || 'User';

  return (
    <nav className="relative z-50 border-b border-white/10">
      <div className="w-full px-6 md:px-10">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <a href="/" className="flex items-center gap-3 group">
            <div className="w-11 h-11 rounded-xl bg-white/15 backdrop-blur-sm flex items-center justify-center group-hover:bg-white/25 transition-colors">
              <Sparkles className="w-6 h-6 text-amber-300" />
            </div>
            <span className={`text-2xl font-bold text-white tracking-tight ${poppins.className}`}>
              Task<span className="text-amber-300">Flow</span>
            </span>
          </a>

          {/* Right side */}
          <div className="flex items-center gap-2">
            {/* Language Toggle */}
            <button
              onClick={toggleLanguage}
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white/80 hover:text-white transition-all duration-200 flex items-center gap-1.5"
              aria-label={language === 'en' ? 'Switch to Urdu' : 'Switch to English'}
            >
              <Languages className="w-4.5 h-4.5" />
              <span className="text-xs font-semibold">{language === 'en' ? 'UR' : 'EN'}</span>
            </button>

            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white/80 hover:text-white transition-all duration-200"
              aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
            >
              {theme === 'light' ? (
                <Moon className="w-4.5 h-4.5" />
              ) : (
                <Sun className="w-4.5 h-4.5" />
              )}
            </button>

            {isLoading ? (
              <div className="w-8 h-8 rounded-full bg-white/20 animate-pulse" />
            ) : user ? (
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className="flex items-center gap-2 pl-1.5 pr-3 py-1.5 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-sm transition-all duration-200 border border-white/10"
                >
                  <div className="w-7 h-7 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-xs font-bold text-white">
                    {userInitial}
                  </div>
                  <span className="text-sm font-medium text-white/90 hidden sm:block max-w-[100px] truncate">
                    {displayName}
                  </span>
                  <ChevronDown className={`w-3.5 h-3.5 text-white/60 transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`} />
                </button>

                {/* Dropdown */}
                {isDropdownOpen && (
                  <div className="absolute right-0 top-full mt-2 w-64 bg-white dark:bg-slate-800 rounded-xl shadow-2xl shadow-black/20 border border-slate-200 dark:border-slate-700 overflow-hidden">
                    {/* Profile header */}
                    <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-700">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white font-bold">
                          {userInitial}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">{displayName}</p>
                          <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{user.email}</p>
                        </div>
                      </div>
                    </div>

                    <div className="p-1.5">
                      <a
                        href="#"
                        onClick={(e) => { e.preventDefault(); setIsDropdownOpen(false); }}
                        className="flex items-center gap-3 px-3 py-2 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors text-sm"
                      >
                        <User className="w-4 h-4 text-slate-400" />
                        {t('navbar.profile')}
                      </a>

                      <div className="my-1 mx-2 border-t border-slate-100 dark:border-slate-700" />

                      <button
                        onClick={handleSignOut}
                        disabled={isSigningOut}
                        className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-colors text-sm disabled:opacity-50"
                      >
                        {isSigningOut ? (
                          <div className="w-4 h-4 border-2 border-rose-400 border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <LogOut className="w-4 h-4" />
                        )}
                        {isSigningOut ? t('navbar.signingOut') : t('navbar.signOut')}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <a href="/sign-in" className="px-4 py-2 text-sm font-medium text-white/80 hover:text-white transition-colors">
                  {t('navbar.signIn')}
                </a>
                <a href="/sign-up" className="px-4 py-2 bg-white text-indigo-600 text-sm font-semibold rounded-lg transition-all hover:bg-white/90 shadow-sm">
                  {t('navbar.getStarted')}
                </a>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
