'use client'

import { useState, useCallback, useRef } from 'react'

interface UseWebSpeechOptions {
  onTranscript?: (text: string) => void
  onError?: (error: string) => void
  lang?: string
}

interface UseWebSpeechReturn {
  isRecording: boolean
  isConnecting: boolean
  error: string | null
  startRecording: () => Promise<void>
  stopRecording: () => void
}

// Extend Window to include SpeechRecognition variants
interface SpeechRecognitionEvent {
  resultIndex: number
  results: SpeechRecognitionResultList
}

export function useWebSpeech(options: UseWebSpeechOptions = {}): UseWebSpeechReturn {
  const { onTranscript, onError, lang = 'en-US' } = options

  const [isRecording, setIsRecording] = useState(false)
  const [isConnecting, setIsConnecting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const recognitionRef = useRef<any>(null)
  const intentionalStopRef = useRef(false)

  const startRecording = useCallback(async () => {
    setError(null)
    setIsConnecting(true)
    intentionalStopRef.current = false

    // Check browser support
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition

    if (!SpeechRecognition) {
      const msg = 'Speech Recognition is not supported in this browser. Please use Chrome or Edge.'
      setError(msg)
      setIsConnecting(false)
      onError?.(msg)
      return
    }

    // Explicitly request microphone permission first
    // This guarantees the browser shows its permission dialog
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      // Stop the stream immediately — SpeechRecognition manages its own audio
      stream.getTracks().forEach(track => track.stop())
    } catch (permErr: any) {
      let msg = `Microphone error: ${permErr.message}`
      if (permErr.name === 'NotAllowedError') {
        msg = 'Microphone access denied. Please allow microphone permission and try again.'
      } else if (permErr.name === 'NotFoundError' || permErr.name === 'DevicesNotFoundError') {
        msg = 'No microphone found. Please connect a microphone or check your device settings.'
      } else if (permErr.name === 'NotReadableError' || permErr.name === 'TrackStartError') {
        msg = 'Microphone is already in use by another application.'
      }

      setError(msg)
      setIsConnecting(false)
      onError?.(msg)
      return
    }

    const recognition = new SpeechRecognition()
    recognition.continuous = true
    recognition.interimResults = false // Only emit final results for clean chunks
    recognition.lang = lang
    recognition.maxAlternatives = 1

    recognition.onstart = () => {
      setIsConnecting(false)
      setIsRecording(true)
    }

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i]
        if (result.isFinal) {
          const text = result[0].transcript.trim()
          if (text) {
            onTranscript?.(text)
          }
        }
      }
    }

    recognition.onerror = (event: any) => {
      // "no-speech" is not fatal — the mic is still listening
      if (event.error === 'no-speech') return

      const msg = `Speech recognition error: ${event.error}`
      setError(msg)
      onError?.(msg)

      if (event.error === 'not-allowed') {
        setIsRecording(false)
        setIsConnecting(false)
      }
    }

    recognition.onend = () => {
      // The browser sometimes kills the recognition session after silence.
      // If the user hasn't explicitly stopped, restart automatically.
      if (!intentionalStopRef.current && recognitionRef.current) {
        try {
          recognitionRef.current.start()
        } catch {
          // Already running — ignore
        }
      } else {
        setIsRecording(false)
      }
    }

    recognitionRef.current = recognition

    try {
      recognition.start()
    } catch {
      setError('Failed to start speech recognition.')
      setIsConnecting(false)
    }
  }, [lang, onTranscript, onError])

  const stopRecording = useCallback(() => {
    intentionalStopRef.current = true
    if (recognitionRef.current) {
      recognitionRef.current.stop()
      recognitionRef.current = null
    }
    setIsRecording(false)
    setIsConnecting(false)
  }, [])

  return { isRecording, isConnecting, error, startRecording, stopRecording }
}

export default useWebSpeech
