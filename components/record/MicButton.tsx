'use client'

// components/record/MicButton.tsx
// Animated microphone button with states: idle, connecting, recording, processing

import { cn } from '@/lib/utils'
import { Mic, Loader2 } from 'lucide-react'

interface MicButtonProps {
  state: 'idle' | 'connecting' | 'recording' | 'processing'
  onClick: () => void
  disabled?: boolean
  className?: string
}

export function MicButton({ state, onClick, disabled, className }: MicButtonProps) {
  const isInteractive = state === 'idle' || state === 'recording'

  return (
    <button
      onClick={onClick}
      disabled={disabled || !isInteractive}
      className={cn(
        'relative flex h-24 w-24 items-center justify-center rounded-full transition-all',
        state === 'idle' && 'bg-gray-700 hover:bg-gray-600 border-2 border-gray-500',
        state === 'connecting' && 'bg-blue-600/30 border-2 border-blue-500 animate-pulse',
        state === 'recording' && 'bg-red-600 border-2 border-red-500',
        state === 'processing' && 'bg-amber-600/30 border-2 border-amber-500',
        !isInteractive && 'cursor-not-allowed',
        className
      )}
    >
      {/* Recording pulse rings */}
      {state === 'recording' && (
        <>
          <span className="absolute inset-0 animate-ping rounded-full border-2 border-red-500 opacity-75" />
          <span className="absolute inset-4 animate-ping rounded-full border-2 border-red-500 opacity-50 delay-75" />
          <span className="absolute inset-8 animate-ping rounded-full border-2 border-red-500 opacity-25 delay-150" />
        </>
      )}

      {/* Icon */}
      {state === 'processing' || state === 'connecting' ? (
        <Loader2 className="h-10 w-10 animate-spin text-white" />
      ) : (
        <Mic className="h-10 w-10 text-white" />
      )}
    </button>
  )
}

export default MicButton