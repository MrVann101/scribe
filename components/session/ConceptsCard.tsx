import { Card } from '@/components/ui/Card'
import { KeyConcept } from '@/types/database'

export function ConceptsCard({ concepts }: { concepts: KeyConcept[] | null }) {
  if (!concepts || concepts.length === 0) return null

  return (
    <Card className="flex flex-col gap-4">
      <h2 className="font-display text-xl font-semibold text-text-primary">Key Concepts</h2>
      <div className="flex flex-col gap-3">
        {concepts.map((concept, idx) => (
          <div key={idx} className="rounded-lg bg-bg-base p-3 border border-border">
            <h4 className="font-medium text-accent-violet mb-1 text-sm">{concept.term}</h4>
            <p className="text-sm text-text-secondary leading-relaxed">{concept.definition}</p>
          </div>
        ))}
      </div>
    </Card>
  )
}