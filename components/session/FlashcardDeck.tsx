'use client'
import { useState } from 'react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Flashcard } from '@/types/database'
import { cn } from '@/lib/utils'
import { RotateCw, Check, X } from 'lucide-react'

export function FlashcardDeck({ cards }: { cards: Flashcard[] | null }) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isFlipped, setIsFlipped] = useState(false)
  const [completed, setCompleted] = useState<Flashcard[]>([])
  const [remaining, setRemaining] = useState<Flashcard[]>(cards || [])
  const [isDone, setIsDone] = useState(false)

  if (!cards || cards.length === 0) return null

  const handleNext = (learned: boolean) => {
    setIsFlipped(false)
    setTimeout(() => {
      const currentCard = remaining[currentIndex]
      
      let newRemaining = [...remaining]
      let newCompleted = [...completed]
      
      if (learned) {
        newCompleted.push(currentCard)
        newRemaining.splice(currentIndex, 1)
      } else {
        // move to back of queue
        newRemaining.splice(currentIndex, 1)
        newRemaining.push(currentCard)
      }
      
      setRemaining(newRemaining)
      setCompleted(newCompleted)
      
      if (newRemaining.length === 0) {
        setIsDone(true)
      } else {
        // if learned, index stays 0 (next card shifts into place)
        // if not learned, we also want to stay at 0 to show the next card in line
        setCurrentIndex(0)
      }
    }, 150) // wait for flip animation
  }

  const handleRestart = () => {
    setRemaining(cards)
    setCompleted([])
    setCurrentIndex(0)
    setIsFlipped(false)
    setIsDone(false)
  }

  return (
    <Card className="flex flex-col h-full min-h-[350px]">
      <div className="flex items-center justify-between mb-6">
        <h2 className="font-display text-xl font-semibold text-text-primary">Flashcards</h2>
        <div className="flex items-center gap-2">
          <div className="h-2 w-24 bg-bg-elevated rounded-full overflow-hidden">
            <div 
              className="h-full bg-accent-blue transition-all duration-500"
              style={{ width: `${(completed.length / cards.length) * 100}%` }}
            />
          </div>
          <span className="text-xs font-medium text-text-secondary">
            {completed.length} / {cards.length}
          </span>
        </div>
      </div>

      {isDone ? (
        <div className="flex flex-col items-center justify-center flex-1 text-center animate-in fade-in zoom-in-95 duration-300">
          <div className="w-16 h-16 rounded-full bg-success/20 text-success flex items-center justify-center mb-4">
            <Check className="h-8 w-8" />
          </div>
          <h3 className="text-xl font-display font-bold text-text-primary mb-2">Deck Completed!</h3>
          <p className="text-text-secondary mb-6 text-sm">You&apos;ve mastered all {cards.length} concepts.</p>
          <Button onClick={handleRestart} icon={<RotateCw className="h-4 w-4" />}>
            Study Again
          </Button>
        </div>
      ) : (
        <div className="flex flex-col flex-1 relative perspective-[1000px]">
          {remaining.length > 0 && (
            <div 
              className={cn(
                "relative flex-1 w-full transition-transform duration-500 transform-style-3d cursor-pointer min-h-[200px]",
                isFlipped ? "rotate-y-180" : ""
              )}
              onClick={() => setIsFlipped(!isFlipped)}
            >
              {/* Front */}
              <div className="absolute inset-0 backface-hidden bg-bg-surface border-2 border-border hover:border-border-subtle rounded-xl p-6 flex flex-col justify-center items-center text-center shadow-sm">
                <span className="absolute top-4 right-4 text-xs font-medium text-accent-violet px-2 py-1 bg-accent-violet/10 rounded-full">
                  {remaining[currentIndex].topic}
                </span>
                <p className="text-lg font-medium text-text-primary mt-4">
                  {remaining[currentIndex].front}
                </p>
                <p className="absolute bottom-4 text-xs text-text-muted flex items-center gap-1">
                  <RotateCw className="h-3 w-3" /> Tap to flip
                </p>
              </div>
              
              {/* Back */}
              <div className="absolute inset-0 backface-hidden rotate-y-180 bg-bg-elevated border-2 border-accent-blue/30 rounded-xl p-6 flex flex-col justify-center items-center text-center shadow-md">
                <p className="text-base text-text-primary overflow-y-auto">
                  {remaining[currentIndex].back}
                </p>
              </div>
            </div>
          )}
          
          <div className={cn(
            "flex gap-4 mt-6 justify-center transition-opacity duration-300",
            isFlipped ? "opacity-100" : "opacity-0 pointer-events-none"
          )}>
            <Button 
              variant="secondary" 
              className="flex-1 border-danger/30 hover:bg-danger/10 hover:text-danger text-text-secondary"
              onClick={(e) => { e.stopPropagation(); handleNext(false) }}
              icon={<X className="h-4 w-4" />}
            >
              Still Learning
            </Button>
            <Button 
              variant="secondary"
              className="flex-1 border-success/30 hover:bg-success/10 hover:text-success text-text-secondary"
              onClick={(e) => { e.stopPropagation(); handleNext(true) }}
              icon={<Check className="h-4 w-4" />}
            >
              Got It
            </Button>
          </div>
        </div>
      )}
    </Card>
  )
}