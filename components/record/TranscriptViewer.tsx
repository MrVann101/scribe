import { useEffect, useRef } from 'react'
import { cn } from '@/lib/utils'
import { Bell } from 'lucide-react'

export interface TranscriptChunk {
  text: string
  isAlert: boolean
  topicLabel?: string
}

interface TranscriptViewerProps {
  chunks: TranscriptChunk[]
}

export function TranscriptViewer({ chunks }: TranscriptViewerProps) {
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [chunks])

  if (chunks.length === 0) {
    return (
      <div className="flex h-full items-center justify-center text-text-muted italic">
        Waiting for audio...
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4 overflow-y-auto pr-2 pb-8 h-full">
      {chunks.map((chunk, i) => (
        <div key={i} className="animate-in fade-in slide-in-from-bottom-2 duration-300">
          {chunk.topicLabel && (
            <div className="mb-2 inline-flex items-center rounded-full bg-accent-violet/10 px-2.5 py-0.5 text-xs font-medium text-accent-violet border border-accent-violet/20">
              {chunk.topicLabel}
            </div>
          )}
          <div
            className={cn(
              "rounded-lg p-3 text-sm font-mono text-text-primary bg-bg-surface border border-border shadow-sm whitespace-pre-wrap",
              chunk.isAlert && "border-l-4 border-l-warning bg-warning/5 text-warning border-y-warning/20 border-r-warning/20"
            )}
          >
            {chunk.isAlert && (
              <div className="mb-1 flex items-center gap-1 font-bold">
                <Bell className="h-3 w-3" />
                Alert
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