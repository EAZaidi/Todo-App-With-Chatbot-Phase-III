'use client';

import { useState, useEffect, useCallback } from 'react';
import { MessageList } from './MessageList';
import { ChatInput } from './ChatInput';
import { sendMessage, startNewChat, getChatHistory, ChatMessage } from '@/lib/api/chat';
import { MessageSquarePlus } from 'lucide-react';

export function ChatContainer() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingContent, setStreamingContent] = useState('');
  const [streamingToolCalls, setStreamingToolCalls] = useState<Array<{ tool: string; input?: any }>>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load initial history
  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    try {
      setIsLoading(true);
      const data = await getChatHistory();
      setMessages(data.messages);
    } catch (error) {
      console.error('Failed to load history:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSend = useCallback(async (message: string) => {
    // Add user message immediately
    const userMsg: ChatMessage = { role: 'user', content: message };
    setMessages(prev => [...prev, userMsg]);
    setIsStreaming(true);
    setStreamingContent('');
    setStreamingToolCalls([]);

    await sendMessage(
      message,
      // onEvent
      (event) => {
        if (event.event === 'token') {
          setStreamingContent(prev => prev + (event.data.delta || ''));
        } else if (event.event === 'tool_call') {
          setStreamingToolCalls(prev => [...prev, event.data]);
        }
      },
      // onError
      (error) => {
        setIsStreaming(false);
        const errorMsg: ChatMessage = { role: 'assistant', content: error };
        setMessages(prev => [...prev, errorMsg]);
      },
      // onDone
      (finalOutput) => {
        setIsStreaming(false);
        setStreamingContent('');
        setStreamingToolCalls([]);
        const assistantMsg: ChatMessage = { role: 'assistant', content: finalOutput };
        setMessages(prev => [...prev, assistantMsg]);
      },
    );
  }, []);

  const handleNewChat = useCallback(async () => {
    try {
      await startNewChat();
      setMessages([]);
      setStreamingContent('');
      setStreamingToolCalls([]);
    } catch (error) {
      console.error('Failed to start new chat:', error);
    }
  }, []);

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2.5 border-b border-slate-200 dark:border-slate-700 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-t-2xl">
        <div className="flex items-center gap-2">
          <span className="text-amber-300">&#10024;</span>
          <h2 className="text-sm font-semibold text-white">Task Assistant</h2>
        </div>
        <button
          onClick={handleNewChat}
          disabled={isStreaming}
          className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-colors disabled:opacity-50"
        >
          <MessageSquarePlus className="w-3.5 h-3.5" />
          New Chat
        </button>
      </div>

      {/* Messages */}
      <MessageList
        messages={messages}
        streamingContent={streamingContent}
        streamingToolCalls={streamingToolCalls}
        isStreaming={isStreaming}
      />

      {/* Input */}
      <ChatInput onSend={handleSend} disabled={isStreaming} />
    </div>
  );
}
