'use client'

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

export function useMicrophone({ sendAudio, onError }: UseMicrophoneOptions): UseMicrophoneReturn {
  const [isRecording, setIsRecording] = useState(false)
  const streamRef = useRef<MediaStream | null>(null)
  const audioContextRef = useRef<AudioContext | null>(null)
  const processorRef = useRef<ScriptProcessorNode | null>(null)

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { sampleRate: 16000, channelCount: 1, echoCancellation: true },
      })
      streamRef.current = stream

      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({
        sampleRate: 16000,
      })
      audioContextRef.current = audioContext

      const source = audioContext.createMediaStreamSource(stream)
      // Use ScriptProcessorNode as fallback since AudioWorklet requires external file serving
      const processor = audioContext.createScriptProcessor(4096, 1, 1)
      processorRef.current = processor

      processor.onaudioprocess = (e) => {
        const inputData = e.inputBuffer.getChannelData(0)
        // Convert Float32 to Int16
        const pcmData = new Int16Array(inputData.length)
        for (let i = 0; i < inputData.length; i++) {
          let s = Math.max(-1, Math.min(1, inputData[i]))
          pcmData[i] = s < 0 ? s * 0x8000 : s * 0x7FFF
        }
        sendAudio(pcmData.buffer)
      }

      source.connect(processor)
      processor.connect(audioContext.destination)

      setIsRecording(true)
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to access microphone')
      onError?.(error)
      setIsRecording(false)
    }
  }, [sendAudio, onError])

  const stopRecording = useCallback(() => {
    if (processorRef.current) {
      processorRef.current.disconnect()
      processorRef.current = null
    }
    if (audioContextRef.current) {
      audioContextRef.current.close()
      audioContextRef.current = null
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop())
      streamRef.current = null
    }
    setIsRecording(false)
  }, [])

  useEffect(() => {
    return () => {
      stopRecording()
    }
  }, [stopRecording])

  return { isRecording, startRecording, stopRecording }
}