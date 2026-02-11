'use client';

import { useState, useRef, useEffect } from 'react';
import { Send } from 'lucide-react';

interface ChatInputProps {
  onSend: (message: string) => void;
  disabled?: boolean;
}

export function ChatInput({ onSend, disabled }: ChatInputProps) {
  const [message, setMessage] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 120) + 'px';
    }
  }, [message]);

  const handleSubmit = () => {
    const trimmed = message.trim();
    if (!trimmed || disabled) return;
    if (trimmed.length > 5000) return;
    onSend(trimmed);
    setMessage('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="border-t border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-4">
      <div className="flex items-end gap-2 max-w-3xl mx-auto">
        <div className="flex-1 relative">
          <textarea
            ref={textareaRef}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a message..."
            disabled={disabled}
            rows={1}
            className="w-full resize-none rounded-xl border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-800 px-4 py-3 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
          />
          {message.length > 4500 && (
            <span className={`absolute bottom-1 right-2 text-xs ${message.length > 5000 ? 'text-red-500' : 'text-slate-400'}`}>
              {message.length}/5000
            </span>
          )}
        </div>
        <button
          onClick={handleSubmit}
          disabled={disabled || !message.trim() || message.trim().length > 5000}
          className="p-3 rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex-shrink-0"
        >
          <Send className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
