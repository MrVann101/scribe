'use client'

// components/record/TranscriptViewer.tsx
// Renders transcript chunks with alerts and topic labels

import { useEffect, useRef } from 'react'
import { cn } from '@/lib/utils'
import { AlertTriangle, Tag } from 'lucide-react'

export interface TranscriptChunk {
  text: string
  isAlert: boolean
  topicLabel?: string
}

interface TranscriptViewerProps {
  chunks: TranscriptChunk[]
  className?: string
}

export function TranscriptViewer({ chunks, className }: TranscriptViewerProps) {
  const bottomRef = useRef<HTMLDivElement>(null)

  // Auto-scroll to bottom on new chunk
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [chunks.length])

  if (chunks.length === 0) {
    return (
      <div className={cn('flex flex-col items-center justify-center py-12 text-center', className)}>
        <div className="h-12 w-12 rounded-full bg-gray-800 flex items-center justify-center mb-4">
          <Mic className="h-6 w-6 text-gray-500" />
        </div>
        <p className="text-gray-400 text-sm">Start speaking to see your transcript here</p>
      </div>
    )
  )
}

// Need to import Mic for the empty state
import { Mic } from 'lucide-react'

export function TranscriptViewerWithImport({ chunks, className }: TranscriptViewerProps) {
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [chunks.length])

  if (chunks.length === 0) {
    return (
      <div className={cn('flex flex-col items-center justify-center py-12 text-center', className)}>
        <div className="h-12 w-12 rounded-full bg-gray-800 flex items-center justify-center mb-4">
          <Mic className="h-6 w-6 text-gray-500" />
        </div>
        <p className="text-gray-400 text-sm">Start speaking to see your transcript here</p>
      </div>
    )
  }

  return (
    <div className={cn('space-y-3 overflow-y-auto max-h-96', className)}>
      {chunks.map((chunk, index) => (
        <div key={index} className="animate-fade-in">
          {/* Topic label */}
          {chunk.topicLabel && (
            <div className="flex items-center gap-1.5 mb-2">
              <Tag className="h-3 w-3 text-violet-400" />
              <span className="text-xs font-medium text-violet-400">{chunk.topicLabel}</span>
            </div>
          )}
          
          {/* Transcript text */}
          <div
            className={cn(
              'rounded-lg p-3 text-sm leading-relaxed',
              chunk.isAlert
                ? 'bg-amber-600/10 border-l-2 border-amber-500 text-amber-100'
                : 'bg-white/5 text-gray-200'
            )}
          >
            {chunk.isAlert && (
              <div className="flex items-center gap-1.5 mb-1">
                <AlertTriangle className="h-3 w-3 text-amber-400" />
                <span className="text-xs font-medium text-amber-400">Important</span>
              </div>
            )}
            {chunk.text}
          </div>
        </div>
      ))}
      <div ref={bottomRef} />
    </div>
  )
}

// Export the main component
export default function TranscriptViewerMain(props: TranscriptViewerProps) {
  return TranscriptViewerWithImport(props)
}