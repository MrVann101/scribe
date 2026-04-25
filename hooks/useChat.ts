'use client'

// hooks/useChat.ts
// Manages chat message state for a session
// Loads history from Supabase, sends new messages to /api/chat, saves reply

import { useState, useCallback, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { ChatMessage as DbChatMessage } from '@/types/database'

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  created_at: string
}

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

  // Fetch existing chat history on mount
  useEffect(() => {
    const fetchHistory = async () => {
      setIsLoading(true)
      try {
        const { data, error: err } = await supabase
          .from('chat_messages')
          .select('*')
          .eq('session_id', sessionId)
          .order('created_at', { ascending: true })

        if (err) throw err

        if (data) {
          setMessages(data.map((msg: DbChatMessage) => ({
            id: msg.id,
            role: msg.role,
            content: msg.content,
            created_at: msg.created_at,
          })))
        }
      } catch (err) {
        console.error('[Scribe] Failed to fetch chat history:', err)
        setError('Failed to load chat history')
      } finally {
        setIsLoading(false)
      }
    }

    if (sessionId) {
      fetchHistory()
    }
  }, [sessionId, supabase])

  const sendMessage = useCallback(async (content: string) => {
    if (!content.trim()) return

    setIsLoading(true)
    setError(null)

    // Optimistically add user message
    const tempId = `temp-${Date.now()}`
    const userMessage: ChatMessage = {
      id: tempId,
      role: 'user',
      content,
      created_at: new Date().toISOString(),
    }

    setMessages(prev => [...prev, userMessage])

    try {
      // Build history for API
      const history = messages.map(msg => ({
        role: msg.role,
        content: msg.content,
      }))

      // Call chat API
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
        const err = await response.json()
        throw new Error(err.error || 'Failed to get response')
      }

      const data = await response.json()

      // Save user message to DB
      const { error: insertErr } = await supabase
        .from('chat_messages')
        .insert({
          session_id: sessionId,
          role: 'user',
          content,
        })

      if (insertErr) {
        console.error('[Scribe] Failed to save user message:', insertErr)
      }

      // Add assistant response
      const assistantMessage: ChatMessage = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: data.reply,
        created_at: new Date().toISOString(),
      }

      setMessages(prev => [...prev, assistantMessage])

      // Save assistant message to DB
      const { error: insertErr2 } = await supabase
        .from('chat_messages')
        .insert({
          session_id: sessionId,
          role: 'assistant',
          content: data.reply,
        })

      if (insertErr2) {
        console.error('[Scribe] Failed to save assistant message:', insertErr2)
      }
    } catch (err) {
      console.error('[Scribe] Chat error:', err)
      setError(err instanceof Error ? err.message : 'Failed to send message')
      
      // Remove optimistic message on error
      setMessages(prev => prev.filter(m => m.id !== tempId))
    } finally {
      setIsLoading(false)
    }
  }, [sessionId, messages, supabase])

  return {
    messages,
    isLoading,
    error,
    sendMessage,
  }
}

export default useChat