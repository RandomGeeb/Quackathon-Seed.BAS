"use client";

import { Wallet, Zap, Activity, ArrowUpRight, ArrowDownLeft } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  ReferenceArea,
} from "recharts";
import {
  SCU_CHART_DATA,
  SCU_PROCESSES,
  SCU_TOTAL_CAPACITY,
  STATUS_COLOR,
  TX_TYPE_COLOR,
} from "@/lib/mock-data";
import { useStore } from "@/lib/store";

function CornerMarks() {
  return (
    <>
      <span className="absolute top-0 left-0 w-3 h-3 border-t border-l border-primary/50 pointer-events-none" />
      <span className="absolute top-0 right-0 w-3 h-3 border-t border-r border-primary/50 pointer-events-none" />
      <span className="absolute bottom-0 left-0 w-3 h-3 border-b border-l border-primary/50 pointer-events-none" />
      <span className="absolute bottom-0 right-0 w-3 h-3 border-b border-r border-primary/50 pointer-events-none" />
    </>
  );
}

export default function Dashboard() {
  const { ccBalance, transactions } = useStore();
  const recentTransactions = transactions.slice(0, 5);
  const scuUsed     = SCU_PROCESSES.reduce((s, p) => s + p.compute, 0);   // 52 SCU/s in use
  const scuLoadPct  = Math.round((scuUsed / SCU_TOTAL_CAPACITY) * 100);
  return (
    <div className="flex flex-col gap-5 p-8 max-w-7xl mx-auto w-full">

      {/* Status Bar */}
      <div className="relative flex justify-between items-center border border-white/[0.06] bg-[#0d0d0d] px-5 py-3">
        <CornerMarks />
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 bg-primary animate-pulse" />
            <span className="font-mono text-[9px] text-white/40 tracking-[0.3em] uppercase">COMPUTE NETWORK</span>
          </div>
          <span className="font-mono text-[9px] text-white/45 tracking-widest">· STATUS: OPTIMAL ·</span>
          <span className="font-mono text-[9px] text-white/40 tracking-wider hidden md:block">47.3°N · 8.5°E · SECTOR_09</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="font-mono text-[9px] text-primary/60 tracking-[0.25em]">LIVE.SYNC</span>
          <div className="border border-primary/30 bg-primary/5 p-1.5">
            <Zap className="w-3 h-3 text-primary" />
          </div>
        </div>
      </div>

      {/* Primary Metrics */}
      <div className="grid grid-cols-2 gap-5">

        {/* Total CC */}
        <div className="relative bg-[#0d0d0d] border border-white/[0.06] p-7 overflow-hidden min-h-[200px] flex flex-col justify-between">
          <CornerMarks />
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <span className="font-mono text-[8px] text-white/45 tracking-[0.35em] uppercase">[SYS.001] // CREDITS</span>
              <Wallet className="w-3.5 h-3.5 text-white/40" />
            </div>
            <p className="font-mono text-[9px] text-primary/50 tracking-[0.2em] uppercase">Total Compute Credits</p>
          </div>
          <div>
            <h2 className="font-mono text-5xl font-black tracking-tighter text-white">
              {ccBalance.toLocaleString()} CC
            </h2>
            <div className="flex items-center gap-3 mt-4">
              <div className="h-px flex-1 bg-white/8" />
              <span className="font-mono text-[8px] text-white/45 tracking-[0.25em] uppercase">Network Currency Pool</span>
            </div>
          </div>
          {/* Dot grid decoration */}
          <div className="absolute right-5 top-1/2 -translate-y-1/2 grid grid-cols-5 gap-1.5 opacity-[0.06]">
            {Array.from({ length: 25 }).map((_, i) => (
              <div key={i} className="w-1 h-1 bg-white" />
            ))}
          </div>
        </div>

        {/* SCU Flow */}
        <div className="relative bg-[#0d0d0d] border border-white/[0.06] p-7 overflow-hidden min-h-[200px] flex flex-col justify-between">
          <CornerMarks />
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <span className="font-mono text-[8px] text-white/45 tracking-[0.35em] uppercase">[SYS.002] // FLOW</span>
              <Activity className="w-3.5 h-3.5 text-primary/40" />
            </div>
            <p className="font-mono text-[9px] text-primary/50 tracking-[0.2em] uppercase">Active SCU Flow</p>
          </div>
          <div>
            <div className="flex items-baseline gap-2">
              <h2 className="font-mono text-5xl font-black tracking-tighter text-white">
                {scuUsed}
              </h2>
              <span className="font-mono text-xs text-white/45 uppercase tracking-[0.2em]">SCU/s</span>
              <span className="font-mono text-sm text-white/25 tracking-tight">/ {SCU_TOTAL_CAPACITY}</span>
            </div>
            <div className="mt-4 space-y-1.5">
              <div className="flex h-0.5 bg-white/5">
                <div className="h-full bg-primary shadow-[0_0_8px_#fa04fa]" style={{ width: `${scuLoadPct}%` }} />
              </div>
              <div className="flex justify-between">
                <span className="font-mono text-[8px] text-white/45 tracking-[0.2em] uppercase">Current Usage / Capacity</span>
                <span className="font-mono text-[8px] text-primary tracking-widest font-black">{scuLoadPct}%</span>
              </div>
            </div>
          </div>
          <div className="absolute right-5 top-1/2 -translate-y-1/2 grid grid-cols-5 gap-1.5 opacity-[0.08]">
            {Array.from({ length: 25 }).map((_, i) => (
              <div key={i} className="w-1 h-1 bg-primary" />
            ))}
          </div>
        </div>

      </div>

      {/* SCU Chart */}
      <div className="relative bg-[#0d0d0d] border border-white/[0.06] p-7">
        <CornerMarks />
        <div className="flex justify-between items-start mb-8">
          <div className="space-y-1">
            <span className="font-mono text-[8px] text-white/45 tracking-[0.35em] uppercase">[DAT.003] // ANALYTICS</span>
            <h3 className="font-mono text-xl font-black tracking-tighter uppercase text-white">SCU USAGE</h3>
          </div>
          <Link href="/dashboard/scu-usage">
            <Button variant="ghost" size="sm" className="h-7 font-mono text-[9px] uppercase tracking-[0.25em] text-primary hover:text-primary/70 hover:bg-primary/5 rounded-none border border-primary/25 hover:border-primary/50 px-4">
              VIEW MORE →
            </Button>
          </Link>
        </div>

        <div className="h-[280px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={SCU_CHART_DATA}>
              <defs>
                <linearGradient id="greenBg" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#22c55e" stopOpacity={0.35} />
                  <stop offset="100%" stopColor="#22c55e" stopOpacity={0.03} />
                </linearGradient>
                <linearGradient id="pinkBg" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#fa04fa" stopOpacity={0.25} />
                  <stop offset="100%" stopColor="#fa04fa" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <ReferenceArea y1={25} fill="url(#greenBg)" />
              <ReferenceLine y={25} stroke="#22c55e" strokeOpacity={0.3} strokeDasharray="4 4" />
              <CartesianGrid strokeDasharray="1 6" vertical={false} stroke="rgba(255,255,255,0.04)" />
              <XAxis dataKey="time" stroke="rgba(255,255,255,0.12)" fontSize={9} tickLine={false} axisLine={false} dy={10} fontFamily="monospace" />
              <YAxis stroke="rgba(255,255,255,0.12)" fontSize={9} tickLine={false} axisLine={false} dx={-10} fontFamily="monospace" />
              <Tooltip
                contentStyle={{ backgroundColor: "#0d0d0d", borderColor: "rgba(250,4,250,0.25)", borderRadius: "0", fontSize: "9px", fontFamily: "monospace" }}
                itemStyle={{ color: "#fa04fa" }}
                labelStyle={{ color: "rgba(255,255,255,0.4)" }}
                cursor={{ stroke: "rgba(250,4,250,0.25)", strokeWidth: 1, strokeDasharray: "4 4" }}
              />
              <Area type="monotone" dataKey="limit" baseValue={25} stroke="rgba(250,4,250,0.4)" strokeWidth={1.5} strokeDasharray="5 5" fill="url(#pinkBg)" fillOpacity={1} animationDuration={1500} activeDot={false} name="Capacity Limit" />
              <Area type="monotone" dataKey="power" stroke="rgba(255,255,255,0.35)" strokeWidth={1.5} fillOpacity={0} animationDuration={1500} name="CAU Usage" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="flex items-center gap-5 mt-5">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-[#22c55e]" />
            <span className="font-mono text-[8px] text-white/50 uppercase tracking-widest">OWNED CAU</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-primary" />
            <span className="font-mono text-[8px] text-white/50 uppercase tracking-widest">BORROWED CAU</span>
          </div>
        </div>
      </div>

      {/* Recent Transactions */}
      <div className="relative bg-[#0d0d0d] border border-white/[0.06] p-7">
        <CornerMarks />
        <div className="flex justify-between items-center mb-7">
          <div className="space-y-1">
            <span className="font-mono text-[8px] text-white/45 tracking-[0.35em] uppercase">[LOG.004] // HISTORY</span>
            <h3 className="font-mono text-lg font-black tracking-tighter uppercase text-white">Recent Transactions</h3>
          </div>
          <Link href="/history">
            <Button variant="ghost" className="font-mono text-[9px] uppercase tracking-[0.25em] text-primary hover:text-primary/70 rounded-none border border-primary/25 hover:border-primary/50 px-4 h-7">
              VIEW ALL →
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-[auto_1fr_auto_auto_auto] gap-4 px-4 mb-2">
          {["#", "TRANSACTION", "COUNTERPARTY", "STATUS", "AMOUNT"].map((h) => (
            <p key={h} className="font-mono text-[8px] text-white/45 tracking-[0.3em] uppercase">{h}</p>
          ))}
        </div>

        <div className="space-y-1">
          {recentTransactions.map((tx, i) => {
            const isIn = tx.type === "IN";
            const statusColor = STATUS_COLOR[tx.status];
            return (
              <div key={tx.id} className="grid grid-cols-[auto_1fr_auto_auto_auto] gap-6 items-center px-5 py-4 border border-white/[0.04] bg-white/[0.01] hover:border-primary/20 hover:bg-primary/[0.02] transition-colors">
                <span className="font-mono text-[9px] text-white/40 w-6">{String(i + 1).padStart(2, "0")}</span>
                <div className="flex items-center gap-3 min-w-0">
                  <div className={`flex h-7 w-7 shrink-0 items-center justify-center border ${isIn ? "border-[#22c55e]/30 bg-[#22c55e]/8" : "border-red-500/30 bg-red-500/8"}`}>
                    {isIn ? <ArrowDownLeft className="w-3.5 h-3.5 text-[#22c55e]" /> : <ArrowUpRight className="w-3.5 h-3.5 text-red-400" />}
                  </div>
                  <div className="min-w-0">
                    <p className="font-mono text-[11px] font-black text-white/85 uppercase tracking-tight truncate">{tx.desc}</p>
                    <p className="font-mono text-[9px] text-white/40 tracking-widest mt-0.5">{tx.id}</p>
                  </div>
                </div>
                <span className="font-mono text-[10px] text-white/60 tracking-tight uppercase truncate max-w-[180px]">{tx.counterparty}</span>
                <div className="flex items-center gap-1.5">
                  <div className={`w-1.5 h-1.5 ${tx.status === "PENDING" ? "animate-pulse" : ""}`} style={{ backgroundColor: statusColor }} />
                  <span className="font-mono text-[9px] uppercase tracking-[0.2em]" style={{ color: statusColor }}>{tx.status}</span>
                </div>
                <span className="font-mono text-sm font-black tracking-wider text-right" style={{ color: TX_TYPE_COLOR[tx.type] }}>
                  {isIn ? "+" : "−"}{tx.amount.toLocaleString()} CC
                </span>
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
}
