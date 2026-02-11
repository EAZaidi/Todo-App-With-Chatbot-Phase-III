import { getAuthToken } from '@/lib/auth-client';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export interface ChatMessage {
  id?: number;
  role: 'user' | 'assistant';
  content: string;
  created_at?: string;
}

export interface SSEEvent {
  event: string;
  data: any;
}

export async function sendMessage(
  message: string,
  onEvent: (event: SSEEvent) => void,
  onError: (error: string) => void,
  onDone: (finalOutput: string) => void,
): Promise<void> {
  const token = getAuthToken();

  const response = await fetch(`${API_BASE_URL}/api/chat`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({ message }),
  });

  if (!response.ok) {
    if (response.status === 401) {
      window.location.href = '/sign-in';
      return;
    }
    const error = await response.json().catch(() => ({ detail: 'Request failed' }));
    onError(error.detail || 'Failed to send message');
    return;
  }

  const reader = response.body?.getReader();
  if (!reader) {
    onError('No response stream');
    return;
  }

  const decoder = new TextDecoder();
  let buffer = '';

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      let currentEvent = '';
      for (const line of lines) {
        if (line.startsWith('event: ')) {
          currentEvent = line.slice(7).trim();
        } else if (line.startsWith('data: ') && currentEvent) {
          const data = line.slice(6);
          try {
            const parsed = JSON.parse(data);
            if (currentEvent === 'done') {
              onDone(parsed.final_output || '');
            } else if (currentEvent === 'error') {
              onError(parsed.error || 'An error occurred');
            } else {
              onEvent({ event: currentEvent, data: parsed });
            }
          } catch {
            // Skip malformed JSON
          }
          currentEvent = '';
        }
      }
    }
  } finally {
    reader.releaseLock();
  }
}

export async function startNewChat(): Promise<{ conversation_id: number; message: string }> {
  const token = getAuthToken();
  const response = await fetch(`${API_BASE_URL}/api/chat/new`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    if (response.status === 401) window.location.href = '/sign-in';
    throw new Error('Failed to start new chat');
  }

  return response.json();
}

export async function getChatHistory(
  limit: number = 50,
  offset: number = 0
): Promise<{ conversation_id: number; messages: ChatMessage[]; total: number }> {
  const token = getAuthToken();
  const response = await fetch(
    `${API_BASE_URL}/api/chat/history?limit=${limit}&offset=${offset}`,
    {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    }
  );

  if (!response.ok) {
    if (response.status === 401) window.location.href = '/sign-in';
    throw new Error('Failed to load chat history');
  }

  return response.json();
}
