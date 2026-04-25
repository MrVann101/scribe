// components/session/ConceptsCard.tsx
// Expandable key concepts list

import { useState } from 'react'
import { Card } from '@/components/ui/Card'
import { ChevronDown, ChevronRight, BookOpen } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { KeyConcept } from '@/types/database'

interface ConceptsCardProps {
  concepts: KeyConcept[]
}

export function ConceptsCard({ concepts }: ConceptsCardProps) {
  const [expanded, setExpanded] = useState<number | null>(null)

  if (concepts.length === 0) {
    return null
  }

  return (
    <Card>
      <h3 className="text-lg font-semibold text-white mb-3">Key Concepts</h3>
      <div className="space-y-2">
        {concepts.map((concept, index) => (
          <div
            key={index}
            className="rounded-lg bg-white/5 overflow-hidden"
          >
            <button
              onClick={() => setExpanded(expanded === index ? null : index)}
              className="w-full flex items-center gap-2 p-3 text-left hover:bg-white/5 transition-colors"
            >
              {expanded === index ? (
                <ChevronDown className="h-4 w-4 text-gray-400" />
              ) : (
                <ChevronRight className="h-4 w-4 text-gray-400" />
              )}
              <BookOpen className="h-4 w-4 text-blue-400" />
              <span className="text-sm font-medium text-white flex-1">{concept.term}</span>
            </button>
            
            {expanded === index && (
              <div className="px-3 pb-3 pt-0">
                <p className="text-sm text-gray-400 pl-6">{concept.definition}</p>
              </div>
            )}
          </div>
        ))}
      </div>
    </Card>
  )
}

export default ConceptsCard