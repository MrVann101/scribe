'use client'

// components/session/FlashcardDeck.tsx
// Flip animation deck, swipe got-it/still-learning

import { useState } from 'react'
import { cn } from '@/lib/utils'
import { RotateCcw, Check, X, Sparkles } from 'lucide-react'
import type { Flashcard } from '@/types/database'

interface FlashcardDeckProps {
  cards: Flashcard[]
}

export function FlashcardDeck({ cards }: FlashcardDeckProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isFlipped, setIsFlipped] = useState(false)
  const [direction, setDirection] = useState<'left' | 'right' | null>(null)
  const [completed, setCompleted] = useState(false)

  if (cards.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-400">No flashcards available for this session.</p>
      </div>
    )
  }

  const currentCard = cards[currentIndex]

  const handleSwipe = (dir: 'left' | 'right') => {
    setDirection(dir)
    
    setTimeout(() => {
      if (currentIndex < cards.length - 1) {
        setCurrentIndex(prev => prev + 1)
        setIsFlipped(false)
        setDirection(null)
      } else {
        setCompleted(true)
      }
    }, 300)
  }

  const handleRestart = () => {
    setCurrentIndex(0)
    setIsFlipped(false)
    setDirection(null)
    setCompleted(false)
  }

  if (completed) {
    return (
      <div className="text-center py-12">
        <Sparkles className="h-16 w-16 text-amber-400 mx-auto mb-4" />
        <h3 className="text-2xl font-bold text-white mb-2">All Done!</h3>
        <p className="text-gray-400 mb-6">You've reviewed all {cards.length} flashcards.</p>
        <button
          onClick={handleRestart}
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <RotateCcw className="h-4 w-4" />
          Restart
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Progress */}
      <div className="flex items-center justify-between text-sm text-gray-400">
        <span>Card {currentIndex + 1} of {cards.length}</span>
        <div className="w-32 h-2 bg-white/10 rounded-full overflow-hidden">
          <div
            className="h-full bg-blue-500 transition-all"
            style={{ width: `${((currentIndex) / cards.length) * 100}%` }}
          />
        </div>
      </div>

      {/* Card */}
      <div
        className={cn(
          'relative h-64 perspective-1000 cursor-pointer',
          direction === 'left' && 'animate-slide-left',
          direction === 'right' && 'animate-slide-right'
        )}
        onClick={() => setIsFlipped(!isFlipped)}
      >
        <div
          className={cn(
            'absolute inset-0 transition-transform duration-500 preserve-3d',
            isFlipped && 'rotate-y-180'
          )}
          style={{ transformStyle: 'preserve-3d' }}
        >
          {/* Front */}
          <div
            className="absolute inset-0 backface-hidden rounded-xl bg-gradient-to-br from-blue-600/20 to-violet-600/20 border border-white/10 p-6 flex flex-col items-center justify-center"
            style={{ backfaceVisibility: 'hidden' }}
          >
            <span className="text-xs text-blue-400 mb-2">{currentCard.topic}</span>
            <p className="text-xl font-medium text-white text-center">{currentCard.front}</p>
            <p className="text-xs text-gray-500 mt-4">Tap to reveal</p>
          </div>

          {/* Back */}
          <div
            className="absolute inset-0 backface-hidden rounded-xl bg-gradient-to-br from-violet-600/20 to-amber-600/20 border border-white/10 p-6 flex flex-col items-center justify-center rotate-y-180"
            style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
          >
            <p className="text-lg text-white text-center">{currentCard.back}</p>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-center gap-4">
        <button
          onClick={() => handleSwipe('left')}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-600/20 text-red-400 hover:bg-red-600/30 transition-colors"
        >
          <X className="h-5 w-5" />
          Still Learning
        </button>
        <button
          onClick={() => handleSwipe('right')}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-green-600/20 text-green-400 hover:bg-green-600/30 transition-colors"
        >
          <Check className="h-5 w-5" />
          Got It
        </button>
      </div>
    </div>
  )
}

export default FlashcardDeck