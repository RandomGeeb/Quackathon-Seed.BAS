import { AssetHeader } from '@/components/asset-header/AssetHeader'
import { MOCK_PORTFOLIO } from '@/lib/data/mock-portfolio'

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <AssetHeader portfolio={MOCK_PORTFOLIO} />
    </div>
  )
}
