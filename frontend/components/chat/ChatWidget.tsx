'use client';

import { useState, useEffect } from 'react';
import { MessageCircle, X } from 'lucide-react';
import { useAuth } from '@/components/auth/AuthProvider';
import { ChatContainer } from './ChatContainer';

export function ChatWidget() {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || !user) return null;

  return (
    <>
      {/* Chat popup */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 z-50 w-[calc(100vw-3rem)] sm:w-[400px] h-[550px] bg-white dark:bg-slate-900 rounded-2xl shadow-2xl shadow-black/20 border border-slate-200 dark:border-slate-700 flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-200">
          <ChatContainer />
        </div>
      )}

      {/* Floating toggle button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full shadow-lg transition-all duration-200 flex items-center justify-center hover:scale-105 active:scale-95 ${
          isOpen
            ? 'bg-slate-700 hover:bg-slate-800 shadow-slate-400/30'
            : 'bg-gradient-to-br from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 shadow-indigo-500/40'
        }`}
        aria-label={isOpen ? 'Close chat' : 'Open chat'}
      >
        {isOpen ? (
          <X className="w-6 h-6 text-white" />
        ) : (
          <MessageCircle className="w-6 h-6 text-white" />
        )}
      </button>
    </>
  );
}
