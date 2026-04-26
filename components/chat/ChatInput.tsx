import { useState, KeyboardEvent } from 'react'
import { SendHorizontal } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ChatInputProps {
  onSend: (message: string) => void
  disabled?: boolean
}

export function ChatInput({ onSend, disabled }: ChatInputProps) {
  const [input, setInput] = useState('')

  const handleSend = () => {
    if (!input.trim() || disabled) return
    onSend(input.trim())
    setInput('')
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className="p-4 border-t border-border bg-bg-surface">
      <div className="relative flex items-end gap-2 rounded-xl border border-border bg-bg-base p-2 focus-within:ring-2 focus-within:ring-accent-blue focus-within:border-transparent transition-all">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask a question about this material..."
          className="max-h-32 min-h-[40px] w-full resize-none bg-transparent px-2 py-2 text-sm text-text-primary placeholder:text-text-muted focus:outline-none"
          rows={1}
          disabled={disabled}
        />
        <button
          onClick={handleSend}
          disabled={!input.trim() || disabled}
          className={cn(
            "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg transition-colors",
            input.trim() && !disabled
              ? "bg-accent-blue text-white hover:bg-accent-blue/90"
              : "bg-bg-elevated text-text-muted"
          )}
        >
          <SendHorizontal className="h-5 w-5" />
        </button>
      </div>
      <div className="mt-2 text-center text-xs text-text-muted">
        Press Enter to send, Shift+Enter for new line
      </div>
    </div>
  )
}