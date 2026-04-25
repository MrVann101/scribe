// components/session/OverviewCard.tsx
// 3-sentence overview + action items

import { Card } from '@/components/ui/Card'
import { CheckCircle, Calendar } from 'lucide-react'
import type { ActionItem } from '@/types/database'

interface OverviewCardProps {
  overview: string
  actionItems: ActionItem[]
}

export function OverviewCard({ overview, actionItems }: OverviewCardProps) {
  return (
    <Card className="md:row-span-1">
      <h3 className="text-lg font-semibold text-white mb-3">Overview</h3>
      <p className="text-gray-300 text-sm leading-relaxed">{overview}</p>

      {actionItems.length > 0 && (
        <div className="mt-4 pt-4 border-t border-white/10">
          <h4 className="text-sm font-medium text-gray-400 mb-2">Action Items</h4>
          <ul className="space-y-2">
            {actionItems.map((item, index) => (
              <li key={index} className="flex items-start gap-2 text-sm">
                <CheckCircle className="h-4 w-4 text-amber-400 mt-0.5 flex-shrink-0" />
                <span className="text-gray-300">{item.text}</span>
                {item.due && (
                  <span className="text-amber-400 text-xs ml-auto flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {item.due}
                  </span>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </Card>
  )
}

export default OverviewCard