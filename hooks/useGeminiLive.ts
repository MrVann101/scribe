'use client'

// hooks/useGeminiLive.ts
import { useState, useCallback, useRef, useEffect } from 'react'
import { LIVE_TRANSCRIBER_PROMPT } from '@/lib/prompts'

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
  // Tracks whether user intentionally disconnected — prevents auto-reconnect
  const intentionalCloseRef = useRef(false)

  const connect = useCallback(async () => {
    if (isConnected || isConnecting) return

    setIsConnecting(true)
    setError(null)
    intentionalCloseRef.current = false

    try {
      const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY

      if (!apiKey) {
        throw new Error(
          'NEXT_PUBLIC_GEMINI_API_KEY is not set. Add it to your .env.local file.'
        )
      }

      // FIX 1: Correct Gemini Live API WebSocket URL
      // The correct endpoint is "streamGenerateContent" not "streamContent"
      // Use gemini-2.0-flash-live-001 which is the stable live audio model
      const model = 'gemini-2.0-flash-live-001'
      const wsUrl = `wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1beta.GenerativeService.BidiGenerateContent?key=${apiKey}`

      const ws = new WebSocket(wsUrl)

      ws.onopen = () => {
        console.log('[Scribe] Gemini Live WebSocket connected')

        // FIX 2: Send setup message only after connection is fully open
        // Must send this first before any audio — Gemini requires a setup handshake
        const setupMessage = {
          setup: {
            model: `models/${model}`,
            system_instruction: {
              parts: [{ text: LIVE_TRANSCRIBER_PROMPT }],
            },
            generation_config: {
              response_modalities: ['TEXT'],
              // Disable audio output — we only want text transcription back
              speech_config: undefined,
            },
          },
        }

        // FIX 3: Guard — confirm socket is still open before sending
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify(setupMessage))
        }

        setIsConnected(true)
        setIsConnecting(false)
        onConnected?.()
      }

      ws.onmessage = (event) => {
        try {
          // FIX 4: Gemini Live sends Blob or string — handle both
          const parseMessage = async (raw: MessageEvent['data']) => {
            let text: string
            if (raw instanceof Blob) {
              text = await raw.text()
            } else {
              text = raw
            }

            const data = JSON.parse(text)

            // Handle transcript text coming back from Gemini
            if (data.serverContent?.modelTurn?.parts) {
              const transcript = data.serverContent.modelTurn.parts
                .map((part: { text?: string }) => part.text ?? '')
                .join('')

              if (transcript.trim()) {
                onTranscript?.(transcript)
              }
            }

            // Handle setup complete confirmation
            if (data.setupComplete) {
              console.log('[Scribe] Gemini Live setup complete — ready for audio')
            }

            // Handle turn complete
            if (data.serverContent?.turnComplete) {
              console.log('[Scribe] Turn complete')
            }

            // Handle server errors returned in the message body
            if (data.error) {
              console.error('[Scribe] Gemini server error:', data.error)
              setError(`Gemini error: ${data.error.message ?? 'Unknown error'}`)
              onError?.(new Error(data.error.message ?? 'Gemini server error'))
            }
          }

          parseMessage(event.data)
        } catch (err) {
          console.error('[Scribe] Error parsing WebSocket message:', err)
        }
      }

      ws.onerror = (event) => {
        console.error('[Scribe] WebSocket error:', event)
        const errMessage =
          'Connection to Gemini failed. Check your API key and internet connection.'
        setError(errMessage)
        setIsConnecting(false)
        onError?.(new Error(errMessage))
      }

      ws.onclose = (event) => {
        console.log(`[Scribe] WebSocket closed — code: ${event.code}, reason: ${event.reason}`)
        setIsConnected(false)
        setIsConnecting(false)

        // FIX 5: Only call onDisconnected if it wasn't an intentional close
        if (!intentionalCloseRef.current) {
          onDisconnected?.()

          // Helpful error messages based on close codes
          if (event.code === 1008) {
            setError('API key invalid or unauthorized. Check your NEXT_PUBLIC_GEMINI_API_KEY.')
          } else if (event.code === 1011) {
            setError('Gemini server error. Try again in a moment.')
          } else if (event.code !== 1000) {
            setError(`Connection closed unexpectedly (code ${event.code}). Try reconnecting.`)
          }
        }
      }

      wsRef.current = ws
    } catch (err) {
      console.error('[Scribe] Failed to connect:', err)
      const message = err instanceof Error ? err.message : 'Failed to connect to Gemini'
      setError(message)
      setIsConnecting(false)
      onError?.(err instanceof Error ? err : new Error(message))
    }
  }, [isConnected, isConnecting, onTranscript, onError, onConnected, onDisconnected])

  const disconnect = useCallback(() => {
    intentionalCloseRef.current = true // Mark as intentional so onclose doesn't fire error

    if (wsRef.current) {
      wsRef.current.close(1000, 'User disconnected')
      wsRef.current = null
    }

    setIsConnected(false)
    setIsConnecting(false)
    onDisconnected?.()
  }, [onDisconnected])

  const sendAudio = useCallback(
    (audioData: ArrayBuffer) => {
      if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
        console.warn('[Scribe] Cannot send audio: WebSocket not open')
        return
      }

      // FIX 6: Check readyState explicitly rather than relying on isConnected state
      const base64 = arrayBufferToBase64(audioData)

      const message = {
        realtimeInput: {
          mediaChunks: [
            {
              mimeType: 'audio/pcm;rate=16000', // FIX 7: specify sample rate — Gemini requires 16kHz PCM
              data: base64,
            },
          ],
        },
      }

      wsRef.current.send(JSON.stringify(message))
    },
    [] // No dependency on isConnected — use readyState check instead
  )

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      intentionalCloseRef.current = true
      if (wsRef.current) {
        wsRef.current.close(1000, 'Component unmounted')
        wsRef.current = null
      }
    }
  }, [])

  return {
    isConnected,
    isConnecting,
    error,
    connect,
    disconnect,
    sendAudio,
  }
}

// Helper: convert ArrayBuffer to base64 string
// Used to encode raw PCM audio before sending over WebSocket
function arrayBufferToBase64(buffer: ArrayBuffer): string {
  let binary = ''
  const bytes = new Uint8Array(buffer)
  const len = bytes.byteLength
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i])
  }
  return btoa(binary)
}

export default useGeminiLive