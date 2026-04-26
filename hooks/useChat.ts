'use client'

import { useState, useCallback, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { ChatMessage } from '@/types/database'

export interface UseChatReturn {
  messages: ChatMessage[]
  isLoading: boolean
  error: string | null
  sendMessage: (content: string) => Promise<void>
}

export function useChat(sessionId: string): UseChatReturn {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClient()

  useEffect(() => {
    async function loadHistory() {
      const { data, error } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('session_id', sessionId)
        .order('created_at', { ascending: true })

      if (error) {
        console.error('Failed to load chat history:', error)
        setError('Failed to load chat history')
      } else if (data) {
        setMessages(data as ChatMessage[])
      }
    }

    if (sessionId) {
      loadHistory()
    }
  }, [sessionId, supabase])

  const sendMessage = useCallback(
    async (content: string) => {
      if (!content.trim()) return

      const userMessageId = crypto.randomUUID()
      const userMessage: ChatMessage = {
        id: userMessageId,
        session_id: sessionId,
        role: 'user',
        content,
        created_at: new Date().toISOString(),
      }

      // Optimistically add user message
      setMessages((prev) => [...prev, userMessage])
      setIsLoading(true)
      setError(null)

      try {
        // Save user message to DB
        await supabase.from('chat_messages').insert(userMessage)

        const history = messages.map((m) => ({
          role: m.role,
          content: m.content,
        }))

        // Call API
        const response = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            session_id: sessionId,
            message: content,
            history,
          }),
        })

        if (!response.ok) {
          throw new Error('Failed to get chat response')
        }

        const data = await response.json()

        const assistantMessageId = crypto.randomUUID()
        const assistantMessage: ChatMessage = {
          id: assistantMessageId,
          session_id: sessionId,
          role: 'assistant',
          content: data.reply,
          created_at: new Date().toISOString(),
        }

        // Save assistant reply to DB
        await supabase.from('chat_messages').insert(assistantMessage)

        // Add assistant reply to state
        setMessages((prev) => [...prev, assistantMessage])
      } catch (err) {
        console.error('Error sending message:', err)
        setError('Failed to send message')
      } finally {
        setIsLoading(false)
      }
    },
    [sessionId, messages, supabase]
  )

  return { messages, isLoading, error, sendMessage }
}