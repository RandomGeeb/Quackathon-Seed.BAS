import Link from 'next/link'
import { LayoutDashboard, Layers, History } from 'lucide-react'

const NAV_ITEMS = [
  { href: '/',        label: 'Dashboard', icon: LayoutDashboard },
  { href: '/leases',  label: 'Leases',    icon: Layers },
  { href: '/history', label: 'History',   icon: History },
]

export function DashboardNav() {
  return (
    <nav className="w-56 min-h-screen border-r border-border flex flex-col gap-1 p-4 bg-background">
      <div className="px-3 py-2 mb-2">
        <span className="text-lg font-semibold tracking-tight text-foreground">
          ComputeBank
        </span>
      </div>
      {NAV_ITEMS.map(({ href, label, icon: Icon }) => (
        <Link
          key={href}
          href={href}
          className="flex items-center gap-3 px-3 py-2 rounded-md text-sm text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
        >
          <Icon className="w-4 h-4" />
          {label}
        </Link>
      ))}
    </nav>
  )
}
