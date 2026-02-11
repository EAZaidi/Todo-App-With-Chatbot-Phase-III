'use client';

import { Bot, Wrench } from 'lucide-react';

interface StreamingMessageProps {
  content: string;
  toolCalls: Array<{ tool: string; input?: any }>;
  isLoading: boolean;
}

export function StreamingMessage({ content, toolCalls, isLoading }: StreamingMessageProps) {
  return (
    <div className="flex gap-3">
      <div className="w-8 h-8 rounded-full bg-amber-100 dark:bg-amber-500/20 flex items-center justify-center flex-shrink-0">
        <Bot className="w-4 h-4 text-amber-600 dark:text-amber-400" />
      </div>
      <div className="flex-1 min-w-0">
        {toolCalls.length > 0 && (
          <div className="mb-2 space-y-1">
            {toolCalls.map((tc, i) => (
              <div key={i} className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                <Wrench className="w-3 h-3" />
                <span>Using {tc.tool}...</span>
              </div>
            ))}
          </div>
        )}
        {content && (
          <div className="inline-block px-4 py-2.5 rounded-2xl rounded-bl-md bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 text-sm leading-relaxed whitespace-pre-wrap">
            {content}
          </div>
        )}
        {isLoading && !content && toolCalls.length === 0 && (
          <div className="flex items-center gap-2 px-4 py-2.5 rounded-2xl rounded-bl-md bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
            <div className="flex gap-1">
              <div className="w-2 h-2 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: '0ms' }} />
              <div className="w-2 h-2 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: '150ms' }} />
              <div className="w-2 h-2 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
            <span className="text-xs text-slate-400">Thinking...</span>
          </div>
        )}
      </div>
    </div>
  );
}
