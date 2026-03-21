import { Card, CardContent } from '@/components/ui/card'
import { Cpu } from 'lucide-react'
import type { SCU } from '@/types'

function formatSCU(value: number): string {
  if (value >= 1_000_000_000) {
    return (value / 1_000_000_000).toFixed(1).replace(/\.0$/, '') + 'B'
  }
  if (value >= 1_000_000) {
    return (value / 1_000_000).toFixed(2).replace(/\.?0+$/, '') + 'M'
  }
  if (value >= 1_000) {
    return (value / 1_000).toFixed(1).replace(/\.0$/, '') + 'K'
  }
  return value.toLocaleString()
}

export function SCUCard({ scu }: { scu: SCU }) {
  return (
    <Card>
      <CardContent>
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-baseline gap-1">
              <p className="text-3xl font-bold tracking-tight text-foreground">
                {formatSCU(scu.available)}
              </p>
              <span className="text-lg font-medium text-muted-foreground">
                / {formatSCU(scu.total)}
              </span>
            </div>
            <p className="text-sm text-muted-foreground mt-1">Available SCU</p>
          </div>
          <Cpu className="w-5 h-5 text-muted-foreground" />
        </div>
      </CardContent>
    </Card>
  )
}
