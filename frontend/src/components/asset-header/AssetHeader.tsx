import { CCCard } from './CCCard'
import { SCUCard } from './SCUCard'
import { ActionRow } from './ActionRow'
import type { Portfolio } from '@/types'

export function AssetHeader({ portfolio }: { portfolio: Portfolio }) {
  return (
    <section className="space-y-4 w-full">
      <div className="grid grid-cols-2 gap-4">
        <CCCard cc={portfolio.cc} />
        <SCUCard scu={portfolio.scu} />
      </div>
      <ActionRow />
    </section>
  )
}
