'use client'
import { useChat } from '@/hooks/useChat'
import { ChatThread } from './ChatThread'
import { ChatInput } from './ChatInput'
import { Card } from '../ui/Card'

export function ChatContainer({ sessionId }: { sessionId: string }) {
  const { messages, isLoading, error, sendMessage } = useChat(sessionId)

  return (
    <Card className="flex flex-col h-[600px] p-0 overflow-hidden bg-bg-base border-none">
      <div className="flex-1 overflow-hidden bg-bg-surface rounded-t-xl border border-border border-b-0">
        <ChatThread messages={messages} isLoading={isLoading} />
      </div>
      <div className="rounded-b-xl overflow-hidden border border-border border-t-0">
        <ChatInput onSend={sendMessage} disabled={isLoading} />
      </div>
      {error && <p className="text-danger text-sm text-center py-2 bg-bg-base">{error}</p>}
    </Card>
  )
}
