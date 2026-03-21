import { Card, CardContent } from '@/components/ui/card'
import { DollarSign } from 'lucide-react'
import { cn } from '@/lib/utils'
import { URGENCY_TEXT_COLORS } from '@/lib/constants/urgency'
import type { CC } from '@/types'

function formatCC(balance: number): string {
  const abs = Math.abs(balance)
  const formatted = new Intl.NumberFormat('en-US').format(abs)
  return balance < 0 ? `-$${formatted}` : `$${formatted}`
}

export function CCCard({ cc }: { cc: CC }) {
  const isDebt = cc.balance < 0

  return (
    <Card
      className={cn(
        isDebt ? 'border border-red-500/40' : 'border-border'
      )}
    >
      <CardContent>
        <div className="flex items-start justify-between">
          <div>
            <p
              className={cn(
                'text-3xl font-bold tracking-tight',
                isDebt ? URGENCY_TEXT_COLORS.critical : 'text-foreground'
              )}
            >
              {formatCC(cc.balance)}
            </p>
            <p className="text-sm text-muted-foreground mt-1">Total CC Balance</p>
          </div>
          <DollarSign className="w-5 h-5 text-muted-foreground" />
        </div>
      </CardContent>
    </Card>
  )
}
