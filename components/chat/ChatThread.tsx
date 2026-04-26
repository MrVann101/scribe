import { useEffect, useRef } from 'react'
import { ChatMessage } from '@/types/database'
import { cn } from '@/lib/utils'
import { Bot, User } from 'lucide-react'

interface ChatThreadProps {
  messages: ChatMessage[]
  isLoading?: boolean
}

export function ChatThread({ messages, isLoading }: ChatThreadProps) {
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isLoading])

  return (
    <div className="flex flex-col gap-6 p-4 overflow-y-auto h-full">
      {messages.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center text-text-muted h-full">
          <Bot className="h-12 w-12 mb-4 opacity-20" />
          <p>Ask me anything about this session!</p>
        </div>
      ) : (
        messages.map((msg, i) => (
          <div
            key={msg.id}
            className={cn(
              "flex gap-4 max-w-[85%] animate-in fade-in slide-in-from-bottom-2",
              msg.role === 'user' ? "self-end flex-row-reverse" : "self-start"
            )}
          >
            <div className={cn(
              "flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
              msg.role === 'user' ? "bg-accent-blue/20 text-accent-blue" : "bg-accent-violet/20 text-accent-violet"
            )}>
              {msg.role === 'user' ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
            </div>
            <div
              className={cn(
                "rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap",
                msg.role === 'user' 
                  ? "bg-accent-blue text-white rounded-tr-sm" 
                  : "bg-bg-elevated border border-border text-text-primary rounded-tl-sm"
              )}
            >
              {msg.content}
            </div>
          </div>
        ))
      )}
      
      {isLoading && (
        <div className="flex gap-4 max-w-[85%] self-start animate-in fade-in">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent-violet/20 text-accent-violet">
            <Bot className="h-4 w-4" />
          </div>
          <div className="rounded-2xl px-4 py-3 bg-bg-elevated border border-border rounded-tl-sm flex items-center gap-1">
            <div className="h-2 w-2 bg-text-muted rounded-full animate-bounce" />
            <div className="h-2 w-2 bg-text-muted rounded-full animate-bounce [animation-delay:0.2s]" />
            <div className="h-2 w-2 bg-text-muted rounded-full animate-bounce [animation-delay:0.4s]" />
          </div>
        </div>
      )}
      <div ref={bottomRef} className="h-px" />
    </div>
  )
}