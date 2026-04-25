'use client'

// hooks/useMicrophone.ts
// Captures mic audio, converts to 16kHz mono PCM, calls sendAudio()
// Uses AudioContext with ScriptProcessorNode for cross-browser compatibility

import { useState, useCallback, useRef, useEffect } from 'react'

export interface UseMicrophoneOptions {
  sendAudio: (data: ArrayBuffer) => void
  onError?: (err: Error) => void
}

export interface UseMicrophoneReturn {
  isRecording: boolean
  startRecording: () => Promise<void>
  stopRecording: () => void
}

export function useMicrophone(options: UseMicrophoneOptions): UseMicrophoneReturn {
  const { sendAudio, onError } = options

  const [isRecording, setIsRecording] = useState(false)
  const audioContextRef = useRef<AudioContext | null>(null)
  const mediaStreamRef = useRef<MediaStream | null>(null)
  const scriptProcessorRef = useRef<ScriptProcessorNode | null>(null)
  const animationFrameRef = useRef<number | null>(null)

  const startRecording = useCallback(async () => {
    try {
      // Request microphone access with 16kHz sample rate for Gemini
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          sampleRate: 16000,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      })

      mediaStreamRef.current = stream

      // Create AudioContext
      const audioContext = new AudioContext({
        sampleRate: 16000,
      })
      audioContextRef.current = audioContext

      // Create source from microphone stream
      const source = audioContext.createMediaStreamSource(stream)

      // Create script processor for audio processing
      // Buffer size of 4096 provides good balance between latency and stability
      const scriptProcessor = audioContext.createScriptProcessor(4096, 1, 1)
      scriptProcessorRef.current = scriptProcessor

      // Process audio data
      scriptProcessor.onaudioprocess = (event) => {
        if (!isRecording) return

        const inputBuffer = event.inputBuffer
        const float32Data = inputBuffer.getChannelData(0)

        // Convert Float32 to Int16 PCM
        const int16Data = new Int16Array(float32Data.length)
        for (let i = 0; i < float32Data.length; i++) {
          // Clamp and convert float to int16
          const sample = Math.max(-1, Math.min(1, float32Data[i]))
          int16Data[i] = sample < 0 ? sample * 0x8000 : sample * 0x7fff
        }

        // Convert to ArrayBuffer and send
        const arrayBuffer = int16Data.buffer
        sendAudio(arrayBuffer)
      }

      // Connect nodes
      source.connect(scriptProcessor)
      scriptProcessor.connect(audioContext.destination)

      setIsRecording(true)
    } catch (err) {
      console.error('[Scribe] Microphone error:', err)
      onError?.(err instanceof Error ? err : new Error('Failed to access microphone'))
    }
  }, [sendAudio, onError, isRecording])

  const stopRecording = useCallback(() => {
    // Stop all tracks
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop())
      mediaStreamRef.current = null
    }

    // Disconnect and close audio context
    if (scriptProcessorRef.current) {
      scriptProcessorRef.current.disconnect()
      scriptProcessorRef.current = null
    }

    if (audioContextRef.current) {
      audioContextRef.current.close()
      audioContextRef.current = null
    }

    // Cancel any pending animation frames
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current)
      animationFrameRef.current = null
    }

    setIsRecording(false)
  }, [])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopRecording()
    }
  }, [stopRecording])

  return {
    isRecording,
    startRecording,
    stopRecording,
  }
}

export default useMicrophone