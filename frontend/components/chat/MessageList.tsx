'use client';

import { useRef, useEffect } from 'react';
import { MessageBubble } from './MessageBubble';
import { StreamingMessage } from './StreamingMessage';
import { ChatMessage } from '@/lib/api/chat';

interface MessageListProps {
  messages: ChatMessage[];
  streamingContent: string;
  streamingToolCalls: Array<{ tool: string; input?: any }>;
  isStreaming: boolean;
}

export function MessageList({ messages, streamingContent, streamingToolCalls, isStreaming }: MessageListProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streamingContent]);

  return (
    <div className="flex-1 overflow-y-auto p-3 space-y-3">
      <div className="space-y-3">
        {messages.length === 0 && !isStreaming && (
          <div className="text-center py-8">
            <div className="w-12 h-12 rounded-xl bg-indigo-100 dark:bg-indigo-500/20 flex items-center justify-center mx-auto mb-3">
              <span className="text-xl">&#10024;</span>
            </div>
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-1">
              How can I help you?
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 px-4">
              Try "Add a task to buy groceries" or "Show me my tasks"
            </p>
          </div>
        )}
        {messages.map((msg, i) => (
          <MessageBubble
            key={msg.id ? `db-${msg.id}` : `local-${i}`}
            role={msg.role}
            content={msg.content}
            timestamp={msg.created_at}
          />
        ))}
        {isStreaming && (
          <StreamingMessage
            content={streamingContent}
            toolCalls={streamingToolCalls}
            isLoading={isStreaming}
          />
        )}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}
