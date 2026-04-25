'use client'

// components/chat/ChatThread.tsx
// Message list, user right / AI left

import { cn } from '@/lib/utils'
import { Bot, User } from 'lucide-react'
import type { ChatMessage } from '@/hooks/useChat'

interface ChatThreadProps {
  messages: ChatMessage[]
  isLoading?: boolean
}

export function ChatThread({ messages, isLoading }: ChatThreadProps) {
  if (messages.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <Bot className="h-12 w-12 text-gray-600 mb-4" />
        <p className="text-gray-400">Start a conversation about your study material</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {messages.map((message) => (
        <div
          key={message.id}
          className={cn(
            'flex gap-3',
            message.role === 'user' ? 'flex-row-reverse' : 'flex-row'
          )}
        >
          {/* Avatar */}
          <div
            className={cn(
              'h-8 w-8 rounded-full flex items-center justify-center flex-shrink-0',
              message.role === 'user' ? 'bg-blue-600' : 'bg-violet-600'
            )}
          >
            {message.role === 'user' ? (
              <User className="h-4 w-4 text-white" />
            ) : (
              <Bot className="h-4 w-4 text-white" />
            )}
          </div>

          {/* Message bubble */}
          <div
            className={cn(
              'max-w-[80%] rounded-2xl px-4 py-2',
              message.role === 'user'
                ? 'bg-blue-600 text-white rounded-br-md'
                : 'bg-white/10 text-gray-200 rounded-bl-md'
            )}
          >
            <p className="text-sm whitespace-pre-wrap">{message.content}</p>
          </div>
        </div>
      ))}

      {isLoading && (
        <div className="flex gap-3">
          <div className="h-8 w-8 rounded-full bg-violet-600 flex items-center justify-center">
            <Bot className="h-4 w-4 text-white" />
          </div>
          <div className="bg-white/10 rounded-2xl rounded-bl-md px-4 py-2">
            <div className="flex gap-1">
              <span className="h-2 w-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '0ms' }} />
              <span className="h-2 w-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '150ms' }} />
              <span className="h-2 w-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default ChatThread