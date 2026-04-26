import { Mic, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface MicButtonProps {
  state: 'idle' | 'connecting' | 'recording' | 'processing'
  onClick: () => void
}

export function MicButton({ state, onClick }: MicButtonProps) {
  const isRecording = state === 'recording'
  
  return (
    <button
      onClick={onClick}
      disabled={state === 'connecting' || state === 'processing'}
      className={cn(
        "relative flex h-24 w-24 items-center justify-center rounded-full transition-all duration-300 mx-auto",
        state === 'idle' && "bg-bg-elevated text-text-muted hover:bg-border-subtle hover:text-text-primary",
        state === 'connecting' && "bg-accent-blue/20 text-accent-blue animate-pulse",
        isRecording && "bg-accent-blue text-white shadow-[0_0_40px_rgba(79,142,247,0.5)]",
        state === 'processing' && "bg-warning/20 text-warning"
      )}
    >
      {isRecording && (
        <>
          <div className="absolute inset-0 rounded-full border border-accent-blue animate-[ping_1.5s_cubic-bezier(0,0,0.2,1)_infinite]"></div>
          <div className="absolute inset-[-10px] rounded-full border border-accent-blue/30 animate-[ping_2s_cubic-bezier(0,0,0.2,1)_infinite]"></div>
        </>
      )}
      
      {state === 'processing' ? (
        <Loader2 className="h-10 w-10 animate-spin" />
      ) : (
        <Mic className="h-10 w-10" />
      )}
    </button>
  )
}