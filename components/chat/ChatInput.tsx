'use client'

// components/chat/ChatInput.tsx
// Textarea, send on Enter, Shift+Enter for newline

import { useState, type KeyboardEvent, type FormEvent } from 'react'
import { cn } from '@/lib/utils'
import { Send } from 'lucide-react'

interface ChatInputProps {
  onSend: (message: string) => void
  isLoading?: boolean
  disabled?: boolean
}

export function ChatInput({ onSend, isLoading, disabled }: ChatInputProps) {
  const [message, setMessage] = useState('')

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    if (message.trim() && !isLoading && !disabled) {
      onSend(message.trim())
      setMessage('')
    }
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <textarea
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Ask a question..."
        disabled={disabled || isLoading}
        rows={1}
        className={cn(
          'flex-1 resize-none rounded-xl border border-white/10 bg-surface/50 px-4 py-3 text-sm text-white',
          'placeholder:text-gray-500',
          'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          'min-h-[48px] max-h-32'
        )}
      />
      <button
        type="submit"
        disabled={disabled || isLoading || !message.trim()}
        className={cn(
          'h-auto min-h-[48px] px-4 rounded-xl bg-blue-600 text-white transition-colors',
          'hover:bg-blue-700',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          'flex items-center justify-center'
        )}
      >
        <Send className="h-5 w-5" />
      </button>
    </form>
  )
}

export default ChatInput