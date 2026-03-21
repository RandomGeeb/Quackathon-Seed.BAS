"use client"

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, Layers, History, Menu, X } from 'lucide-react'
import { useState } from 'react'

const NAV_ITEMS = [
  { href: '/',        label: 'Dashboard', icon: LayoutDashboard },
  { href: '/leases',  label: 'Leases',    icon: Layers },
  { href: '/history', label: 'History',   icon: History },
]

export function TopNav() {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)

  return (
    <header className="relative px-5 py-4 flex items-center justify-between border-b border-white/5">
      {/* Logo */}
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-full bg-[#a3e635] flex items-center justify-center shrink-0">
          <span className="text-[#0a0a0a] font-black text-sm select-none">C</span>
        </div>
        <span className="text-white font-bold text-sm tracking-[0.18em] uppercase">ComputeBank</span>
      </div>

      {/* Hamburger */}
      <button
        onClick={() => setOpen(!open)}
        className="w-9 h-9 rounded-full border border-white/10 flex items-center justify-center text-white/60 hover:text-white transition-colors"
        aria-label="Menu"
      >
        {open ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
      </button>

      {/* Dropdown */}
      {open && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setOpen(false)}
          />
          <div className="absolute top-[calc(100%+8px)] right-4 bg-[#1a1a1a] border border-white/10 rounded-2xl py-2 z-50 min-w-44 shadow-2xl">
            {NAV_ITEMS.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                onClick={() => setOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 text-xs font-mono uppercase tracking-[0.15em] transition-colors ${
                  pathname === href
                    ? 'text-[#a3e635]'
                    : 'text-white/50 hover:text-white'
                }`}
              >
                <Icon className="w-4 h-4" />
                {label}
              </Link>
            ))}
          </div>
        </>
      )}
    </header>
  )
}
