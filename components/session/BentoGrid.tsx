'use client'

// components/session/BentoGrid.tsx
// 2x2 grid layout for session summary with tabs

import { useState } from 'react'
import { cn } from '@/lib/utils'
import type { Summary, Flashcard, QuizQuestion } from '@/types/database'
import { OverviewCard } from './OverviewCard'
import { ConceptsCard } from './ConceptsCard'
import { QuizCard } from './QuizCard'
import { FlashcardDeck } from './FlashcardDeck'

interface BentoGridProps {
  summary: Summary | null
  flashcards: Flashcard[]
  quiz: QuizQuestion[]
}

type Tab = 'summary' | 'flashcards' | 'quiz' | 'chat'

const tabs: { id: Tab; label: string }[] = [
  { id: 'summary', label: 'Summary' },
  { id: 'flashcards', label: 'Flashcards' },
  { id: 'quiz', label: 'Quiz' },
  { id: 'chat', label: 'Chat' },
]

export function BentoGrid({ summary, flashcards, quiz }: BentoGridProps) {
  const [activeTab, setActiveTab] = useState<Tab>('summary')

  return (
    <div className="space-y-4">
      {/* Tab navigation */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              'px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors',
              activeTab === tab.id
                ? 'bg-blue-600 text-white'
                : 'bg-white/5 text-gray-400 hover:text-white'
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {activeTab === 'summary' && (
          <>
            <OverviewCard
              overview={summary?.overview || ''}
              actionItems={summary?.action_items || []}
            />
            <ConceptsCard concepts={summary?.key_concepts || []} />
          </>
        )}

        {activeTab === 'flashcards' && (
          <div className="md:col-span-2">
            <FlashcardDeck cards={flashcards} />
          </div>
        )}

        {activeTab === 'quiz' && (
          <div className="md:col-span-2">
            <QuizCard questions={quiz} />
          </div>
        )}

        {activeTab === 'chat' && (
          <div className="md:col-span-2">
            <p className="text-gray-400 text-center py-8">
              Use the chat panel on the right to ask questions about this material.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

export default BentoGrid