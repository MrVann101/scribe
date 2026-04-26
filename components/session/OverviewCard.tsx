import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { ActionItem } from '@/types/database'

interface OverviewCardProps {
  overview: string | null
  actionItems: ActionItem[] | null
}

export function OverviewCard({ overview, actionItems }: OverviewCardProps) {
  return (
    <Card className="flex flex-col gap-4">
      <h2 className="font-display text-xl font-semibold text-text-primary">Overview</h2>
      <p className="text-text-secondary text-sm leading-relaxed whitespace-pre-wrap">
        {overview || "No overview available."}
      </p>

      {actionItems && actionItems.length > 0 && (
        <div className="mt-2 pt-4 border-t border-border">
          <h3 className="font-medium text-text-primary mb-3 text-sm">Action Items</h3>
          <ul className="space-y-3">
            {actionItems.map((item, idx) => (
              <li key={idx} className="flex items-start gap-2 text-sm text-text-secondary">
                <div className="mt-1.5 h-1.5 w-1.5 rounded-full bg-accent-blue shrink-0" />
                <span className="flex-1 leading-snug">{item.text}</span>
                {item.due && (
                  <Badge variant="alert" className="shrink-0">{item.due}</Badge>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </Card>
  )
}