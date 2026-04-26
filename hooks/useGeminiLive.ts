'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import { LIVE_TRANSCRIBER_PROMPT } from '@/lib/prompts'

// WebSocket URL for Gemini Multimodal Live API
const GEMINI_LIVE_WS_URL =
  'wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1beta.GenerativeService.BidiGenerateContent'

// Always use the live-specific model — NOT gemini-2.5-flash
const LIVE_MODEL = 'gemini-2.0-flash-live-001'

interface UseGeminiLiveOptions {
  onTranscript?: (text: string) => void
  onError?: (error: Error) => void
  onConnected?: () => void
  onDisconnected?: () => void
}

interface UseGeminiLiveReturn {
  isConnected: boolean
  isConnecting: boolean
  error: string | null
  connect: () => Promise<void>
  disconnect: () => void
  sendAudio: (audioData: ArrayBuffer) => void
}

export function useGeminiLive(options: UseGeminiLiveOptions = {}): UseGeminiLiveReturn {
  const { onTranscript, onError, onConnected, onDisconnected } = options

  const [isConnected, setIsConnected] = useState(false)
  const [isConnecting, setIsConnecting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const wsRef = useRef<WebSocket | null>(null)
  const intentionalCloseRef = useRef(false)

  const connect = useCallback(async () => {
    if (isConnected || isConnecting) return

    setIsConnecting(true)
    setError(null)
    intentionalCloseRef.current = false

    try {
      const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY
      if (!apiKey) throw new Error('NEXT_PUBLIC_GEMINI_API_KEY is not set in .env.local')

      const ws = new WebSocket(`${GEMINI_LIVE_WS_URL}?key=${apiKey}`)

      ws.onopen = () => {
        if (ws.readyState !== WebSocket.OPEN) return
        ws.send(JSON.stringify({
          setup: {
            model: `models/${LIVE_MODEL}`,
            system_instruction: { parts: [{ text: LIVE_TRANSCRIBER_PROMPT }] },
            generation_config: { response_modalities: ['TEXT'] },
          },
        }))
        setIsConnected(true)
        setIsConnecting(false)
        onConnected?.()
      }

      ws.onmessage = async (event) => {
        try {
          const raw = event.data instanceof Blob ? await event.data.text() : event.data
          const data = JSON.parse(raw)

          if (data.serverContent?.modelTurn?.parts) {
            const text = data.serverContent.modelTurn.parts
              .map((p: { text?: string }) => p.text ?? '')
              .join('')
            if (text.trim()) onTranscript?.(text)
          }

          if (data.error) {
            setError(`Gemini error: ${data.error.message ?? 'Unknown'}`)
            onError?.(new Error(data.error.message ?? 'Gemini error'))
          }
        } catch (err) {
          console.error('[Scribe] WS parse error:', err)
        }
      }

      ws.onerror = () => {
        const msg = 'Connection failed. Check API key and internet.'
        setError(msg)
        setIsConnecting(false)
        onError?.(new Error(msg))
      }

      ws.onclose = (event) => {
        setIsConnected(false)
        setIsConnecting(false)
        if (!intentionalCloseRef.current) {
          onDisconnected?.()
          if (event.code === 1008) setError('API key invalid or unauthorized.')
          else if (event.code !== 1000) setError(`Disconnected (code ${event.code}). Try again.`)
        }
      }

      wsRef.current = ws
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to connect'
      setError(msg)
      setIsConnecting(false)
      onError?.(new Error(msg))
    }
  }, [isConnected, isConnecting, onTranscript, onError, onConnected, onDisconnected])

  const disconnect = useCallback(() => {
    intentionalCloseRef.current = true
    wsRef.current?.close(1000, 'User disconnected')
    wsRef.current = null
    setIsConnected(false)
    setIsConnecting(false)
    onDisconnected?.()
  }, [onDisconnected])

  const sendAudio = useCallback((audioData: ArrayBuffer) => {
    if (wsRef.current?.readyState !== WebSocket.OPEN) return
    const bytes = new Uint8Array(audioData)
    let binary = ''
    bytes.forEach(b => binary += String.fromCharCode(b))
    wsRef.current.send(JSON.stringify({
      realtimeInput: {
        mediaChunks: [{ mimeType: 'audio/pcm;rate=16000', data: btoa(binary) }],
      },
    }))
  }, [])

  useEffect(() => {
    return () => {
      intentionalCloseRef.current = true
      wsRef.current?.close(1000, 'Unmounted')
    }
  }, [])

  return { isConnected, isConnecting, error, connect, disconnect, sendAudio }
}

export default useGeminiLive