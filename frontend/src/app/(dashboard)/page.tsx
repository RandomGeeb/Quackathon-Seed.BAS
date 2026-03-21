"use client"

import { useEffect, useState } from 'react'
import {
  Eye,
  TrendingUp,
  Zap,
  Link2,
  ArrowDownLeft,
  ArrowUpRight,
} from 'lucide-react'
import { MOCK_PORTFOLIO } from '@/lib/data/mock-portfolio'

function LiveHeader() {
  const [time, setTime] = useState('')

  useEffect(() => {
    const update = () =>
      setTime(
        new Date().toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit',
          hour12: false,
        })
      )
    update()
    const id = setInterval(update, 1000)
    return () => clearInterval(id)
  }, [])

  return (
    <div className="flex items-start justify-between mb-7">
      <div>
        <div className="flex items-center gap-3 mb-1">
          <h1 className="text-[2.6rem] font-black text-white uppercase leading-none tracking-tight">
            Dashboard
          </h1>
          <span className="px-2.5 py-0.5 bg-[#a3e635] text-[#0a0a0a] text-[9px] font-black rounded-full uppercase tracking-[0.2em] mt-0.5 self-start">
            Live
          </span>
        </div>
        <p className="font-mono text-[10px] text-white/30 uppercase tracking-[0.25em]">
          Real&#8209;time financial overview
        </p>
      </div>
      <div className="text-right shrink-0 ml-4">
        <p className="font-mono text-[9px] text-white/30 uppercase tracking-wider">
          Last Update
        </p>
        <p className="font-mono text-[#a3e635] text-xs font-bold tabular-nums">
          {time}
        </p>
      </div>
    </div>
  )
}

export default function DashboardPage() {
  const { scu, cau, cc } = MOCK_PORTFOLIO

  return (
    <div>
      <LiveHeader />

      {/* ── Total SCU Capacity card ── */}
      <div className="rounded-2xl bg-[#172017] p-5 mb-4">
        <div className="flex items-start justify-between mb-5">
          <p className="font-mono text-[10px] text-white/40 uppercase tracking-[0.2em]">
            Total Balance
          </p>
          <Eye className="w-4 h-4 text-[#a3e635]" />
        </div>

        <p className="text-4xl font-black text-white mb-5 tabular-nums">
          {scu.total.toLocaleString('en-US')}
          <span className="text-lg font-medium text-white/30 ml-2">SCU</span>
        </p>

        <div className="grid grid-cols-3 gap-3">
          {/* Growth */}
          <div>
            <div className="flex items-center gap-1 mb-0.5">
              <TrendingUp className="w-3 h-3 text-[#a3e635]" />
              <span className="font-mono text-[9px] text-white/30 uppercase tracking-wider">
                Growth
              </span>
            </div>
            <p className="font-mono text-xs font-bold text-[#a3e635]">+3.2%</p>
          </div>

          {/* Production */}
          <div>
            <div className="flex items-center gap-1 mb-0.5">
              <Zap className="w-3 h-3 text-white/30" />
              <span className="font-mono text-[9px] text-white/30 uppercase tracking-wider">
                This Hour
              </span>
            </div>
            <p className="font-mono text-xs font-bold text-white tabular-nums">
              +{cau.productionRatePerHour.toLocaleString()}
            </p>
          </div>

          {/* Active leases */}
          <div>
            <div className="flex items-center gap-1 mb-0.5">
              <Link2 className="w-3 h-3 text-white/30" />
              <span className="font-mono text-[9px] text-white/30 uppercase tracking-wider">
                Active
              </span>
            </div>
            <p className="font-mono text-xs font-bold text-white">3 Leases</p>
          </div>
        </div>
      </div>

      {/* ── Available SCU card ── */}
      <div className="rounded-2xl bg-[#141414] p-5 mb-4">
        <div className="flex items-start justify-between mb-5">
          <div className="w-12 h-12 rounded-xl bg-[#1e2e1e] flex items-center justify-center">
            <ArrowDownLeft className="w-5 h-5 text-[#a3e635]" />
          </div>
          <span className="px-3 py-1 bg-[#a3e635]/15 text-[#a3e635] text-[10px] font-mono font-bold rounded-full border border-[#a3e635]/20">
            +{((scu.available / scu.total) * 100).toFixed(1)}%
          </span>
        </div>
        <p className="font-mono text-[10px] text-white/40 uppercase tracking-[0.2em] mb-1.5">
          Available SCU
        </p>
        <p className="text-3xl font-black text-white tabular-nums">
          {scu.available.toLocaleString('en-US')}
        </p>
      </div>

      {/* ── CC Balance card ── */}
      <div className="rounded-2xl bg-[#141414] p-5">
        <div className="flex items-start justify-between mb-5">
          <div className="w-12 h-12 rounded-xl bg-[#2b1616] flex items-center justify-center">
            <ArrowUpRight className="w-5 h-5 text-red-400" />
          </div>
          <span className="px-3 py-1 bg-red-500/10 text-red-400 text-[10px] font-mono font-bold rounded-full border border-red-500/20">
            −8.2%
          </span>
        </div>
        <p className="font-mono text-[10px] text-white/40 uppercase tracking-[0.2em] mb-1.5">
          CC Balance
        </p>
        <p className="text-3xl font-black text-white tabular-nums">
          {cc.balance < 0 ? '−' : ''}$
          {Math.abs(cc.balance).toLocaleString('en-US')}
        </p>
      </div>
    </div>
  )
}
