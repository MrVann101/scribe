'use client'
import { useState, ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface TabProps {
  id: string
  label: string
}

const TABS: TabProps[] = [
  { id: 'summary', label: 'Summary' },
  { id: 'flashcards', label: 'Flashcards' },
  { id: 'quiz', label: 'Quiz' },
  { id: 'chat', label: 'Chat' },
]

export function SessionTabs({ 
  summaryContent, 
  flashcardsContent, 
  quizContent, 
  chatContent 
}: { 
  summaryContent: ReactNode, 
  flashcardsContent: ReactNode, 
  quizContent: ReactNode, 
  chatContent: ReactNode 
}) {
  const [activeTab, setActiveTab] = useState('summary')

  return (
    <div className="flex flex-col h-full">
      <div className="flex gap-2 overflow-x-auto pb-4 mb-4 hide-scrollbar">
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors",
              activeTab === tab.id 
                ? "bg-accent-blue text-white" 
                : "bg-bg-elevated text-text-secondary hover:bg-border-subtle hover:text-text-primary"
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>
      
      <div className="flex-1 animate-in fade-in duration-300">
        {activeTab === 'summary' && summaryContent}
        {activeTab === 'flashcards' && flashcardsContent}
        {activeTab === 'quiz' && quizContent}
        {activeTab === 'chat' && chatContent}
      </div>
    </div>
  )
}
