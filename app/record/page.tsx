'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useGeminiLive } from '@/hooks/useGeminiLive'

export default function RecordPage() {
  const [isRecording, setIsRecording] = useState(false)
  const [transcript, setTranscript] = useState<string>('')
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const transcriptEndRef = useRef<HTMLDivElement>(null)
  const router = useRouter()

  const { isConnected, isConnecting, connect, disconnect, sendAudio, error: wsError } = useGeminiLive({
    onTranscript: (text) => {
      setTranscript(prev => prev + '\n' + text)
    },
    onError: (err) => {
      setError(err.message)
    },
    onConnected: () => {
      console.log('Connected to Gemini Live')
    },
    onDisconnected: () => {
      console.log('Disconnected from Gemini Live')
    }
  })

  // Auto-scroll transcript
  useEffect(() => {
    transcriptEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [transcript])

  // Audio capture setup
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioContextRef = useRef<AudioContext | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)

  const startRecording = async () => {
    try {
      setError(null)
      
      // Request microphone access
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        } 
      })

      // Set up audio context for processing
      const audioContext = new AudioContext()
      const source = audioContext.createMediaStreamSource(stream)
      const analyser = audioContext.createAnalyser()
      analyser.fftSize = 256
      source.connect(analyser)
      
      audioContextRef.current = audioContext
      analyserRef.current = analyser

      // Connect to Gemini Live
      await connect()
      
      // Start capturing audio
      const bufferSize = 4096
      const recorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      })

      recorder.ondataavailable = async (event) => {
        if (event.data.size > 0 && isConnected) {
          // Convert to ArrayBuffer and send
          const arrayBuffer = await event.data.arrayBuffer()
          sendAudio(arrayBuffer)
        }
      }

      recorder.start(100) // Collect data every 100ms
      mediaRecorderRef.current = recorder
      
      setIsRecording(true)

      // Create session in background
      const sessionRes = await fetch('/api/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ source: 'recording' })
      })
      const sessionData = await sessionRes.json()
      if (sessionData.session_id) {
        setSessionId(sessionData.session_id)
      }

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start recording')
    }
  }

  const stopRecording = async () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop()
      mediaRecorderRef.current = null
    }
    
    if (audioContextRef.current) {
      await audioContextRef.current.close()
      audioContextRef.current = null
    }

    disconnect()
    setIsRecording(false)

    // Process transcript and generate summary
    if (sessionId && transcript) {
      try {
        // Save transcript chunks
        await fetch('/api/transcripts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            session_id: sessionId,
            transcript: transcript
          })
        })

        // Trigger summarization
        await fetch('/api/summarize', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            session_id: sessionId,
            source: 'recording'
          })
        })

        // Redirect to session
        router.push(`/session/${sessionId}`)
      } catch (err) {
        console.error('Failed to process recording:', err)
      }
    }
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center mb-8">
          <a href="/" className="text-purple-300 hover:text-white transition-colors">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </a>
          <h1 className="text-2xl font-bold text-white ml-4">Live Recording</h1>
        </div>

        {/* Recording Controls */}
        <div className="max-w-2xl mx-auto text-center mb-8">
          <div className={`w-32 h-32 mx-auto rounded-full flex items-center justify-center transition-all ${
            isRecording 
              ? 'bg-red-500 animate-pulse' 
              : 'bg-purple-600 hover:bg-purple-700'
          }`}>
            <button
              onClick={isRecording ? stopRecording : startRecording}
              disabled={isConnecting}
              className="w-24 h-24 rounded-full bg-white/20 flex items-center justify-center"
            >
              {isConnecting ? (
                <svg className="animate-spin h-10 w-10 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              ) : isRecording ? (
                <div className="w-8 h-8 bg-white rounded-sm" />
              ) : (
                <div className="w-10 h-10 bg-white rounded-full" />
              )}
            </button>
          </div>
          
          <p className="text-white mt-4 text-lg">
            {isConnecting ? 'Connecting...' : isRecording ? 'Recording...' : 'Tap to start recording'}
          </p>
          
          {error && (
            <div className="mt-4 p-4 bg-red-500/20 border border-red-400 rounded-lg text-red-200">
              {error}
            </div>
          )}
          
          {wsError && (
            <div className="mt-4 p-4 bg-yellow-500/20 border border-yellow-400 rounded-lg text-yellow-200">
              {wsError}
            </div>
          )}
        </div>

        {/* Transcript Display */}
        <div className="max-w-4xl mx-auto">
          <div className="bg-white/5 rounded-2xl p-6 min-h-[400px] max-h-[600px] overflow-y-auto">
            <h2 className="text-white font-semibold mb-4 flex items-center">
              <span className={`w-3 h-3 rounded-full mr-2 ${isRecording ? 'bg-red-500 animate-pulse' : 'bg-gray-500'}`} />
              Live Transcript
            </h2>
            
            {transcript ? (
              <div className="text-purple-100 whitespace-pre-wrap">
                {transcript}
              </div>
            ) : (
              <p className="text-purple-300/50 text-center py-20">
                {isRecording ? 'Listening...' : 'Start recording to see transcript'}
              </p>
            )}
            <div ref={transcriptEndRef} />
          </div>
        </div>

        {/* Tips */}
        <div className="max-w-2xl mx-auto mt-8">
          <div className="bg-purple-500/20 border border-purple-400/30 rounded-xl p-4">
            <h3 className="text-white font-medium mb-2">💡 Recording Tips</h3>
            <ul className="text-purple-200 text-sm space-y-1">
              <li>• Ensure you're in a quiet environment</li>
              <li>• Speak clearly and at a normal pace</li>
              <li>• The instructor may switch between English and Bisaya</li>
              <li>• Important exam/quiz dates will be automatically flagged</li>
            </ul>
          </div>
        </div>
      </div>
    </main>
  )
}