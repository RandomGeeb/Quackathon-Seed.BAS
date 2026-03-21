import { TopNav } from '@/components/layout/TopNav'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      <TopNav />
      <main className="px-5 py-6 max-w-lg mx-auto">
        {children}
      </main>
    </div>
  )
}
