'use client';

import { User, Bot } from 'lucide-react';

interface MessageBubbleProps {
  role: 'user' | 'assistant';
  content: string;
  timestamp?: string;
}

export function MessageBubble({ role, content, timestamp }: MessageBubbleProps) {
  const isUser = role === 'user';

  return (
    <div className={`flex gap-3 ${isUser ? 'flex-row-reverse' : ''}`}>
      <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
        isUser
          ? 'bg-indigo-100 dark:bg-indigo-500/20'
          : 'bg-amber-100 dark:bg-amber-500/20'
      }`}>
        {isUser ? (
          <User className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
        ) : (
          <Bot className="w-4 h-4 text-amber-600 dark:text-amber-400" />
        )}
      </div>
      <div className={`max-w-[80%] ${isUser ? 'text-right' : ''}`}>
        <div className={`inline-block px-4 py-2.5 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${
          isUser
            ? 'bg-indigo-600 text-white rounded-br-md'
            : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-bl-md'
        }`}>
          {content}
        </div>
        {timestamp && (
          <p className={`text-xs text-slate-400 mt-1 ${isUser ? 'text-right' : ''}`}>
            {new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </p>
        )}
      </div>
    </div>
  );
}
