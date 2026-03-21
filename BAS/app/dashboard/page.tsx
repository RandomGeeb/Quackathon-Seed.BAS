"use client";

import {
  TrendingUp,
  Wallet,
  ArrowUpRight,
  Search,
  Zap,
  Clock,
  Activity,
  ArrowRight,
} from "lucide-react";
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

const decayData = [
  { time: "10:00", power: 40, limit: 45, label: "Full burst" },
  { time: "10:05", power: 15, limit: 60, label: "Drop off" },
  { time: "10:10", power: 45, limit: 50, label: "Rebound" },
  { time: "10:15", power: 20, limit: 58, label: "Throttling" },
  { time: "10:20", power: 8, limit: 42, label: "Lease Warning" },
  { time: "10:25", power: 52, limit: 55, label: "Power Surge" },
  { time: "10:30", power: 25, limit: 45, label: "Critical" },
  { time: "10:35", power: 10, limit: 50, label: "Low Stable" },
];

export default function Dashboard() {
  return (
    <div className="flex flex-col gap-8 p-8 max-w-7xl mx-auto w-full">
      {/* Dynamic Header */}
      <div className="flex justify-between items-center bg-card/30 backdrop-blur-md border border-white/5 p-4 rounded-2xl">
        <div className="flex items-center gap-3 opacity-40">
          <Search className="w-4 h-4" />
          <span className="text-xs font-bold uppercase tracking-widest text-foreground">
            Compute Network Status: OPTIMAL
          </span>
        </div>
        <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                <span className="text-[10px] font-black text-primary uppercase tracking-tighter">Live Sync</span>
            </div>
          <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center border border-primary/20">
            <Zap className="w-4 h-4 text-primary" />
          </div>
        </div>
      </div>

      {/* Primary Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-8">
        {/* Total CC Card */}
        <div className="relative overflow-hidden bg-card border border-white/5 rounded-3xl p-8 shadow-2xl flex flex-col justify-between min-h-[220px]">
          <div className="relative z-10 space-y-2">
            <div className="flex justify-between items-center opacity-40">
              <p className="text-[10px] font-bold uppercase tracking-[0.2em]">Total Credits</p>
              <Wallet className="w-4 h-4" />
            </div>
            <h2 className="text-5xl font-black tracking-tighter text-foreground">$150,100<span className="text-lg opacity-20">.00</span></h2>
          </div>
          <div className="relative z-10 flex items-center gap-4 pt-4 border-t border-white/5">
             <p className="text-[10px] uppercase font-bold tracking-widest opacity-40 uppercase">Network Currency Pool</p>
          </div>
          <div className="absolute top-0 right-0 w-[200px] h-[200px] bg-primary/5 blur-[60px] rounded-full -mr-20 -mt-20 pointer-events-none" />
        </div>

        {/* SCU Usage Card */}
        <div className="relative overflow-hidden bg-card border border-white/5 rounded-3xl p-8 shadow-2xl flex flex-col justify-between min-h-[220px]">
          <div className="relative z-10 space-y-2">
            <div className="flex justify-between items-center opacity-40">
              <p className="text-[10px] font-bold uppercase tracking-[0.2em]">Active SCU Flow</p>
              <Activity className="w-4 h-4 text-primary" />
            </div>
            <div className="flex items-baseline gap-2">
              <h2 className="text-5xl font-black tracking-tighter text-foreground">1.1B</h2>
              <span className="text-lg font-bold opacity-20 uppercase">Processing</span>
            </div>
          </div>
          <div className="relative z-10 space-y-3">
            <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
              <div className="h-full bg-primary shadow-[0_0_10px_#ff69b4]" style={{ width: "45%" }} />
            </div>
            <p className="text-[10px] uppercase font-bold tracking-widest opacity-40">Compute Load 45%</p>
          </div>
          <div className="absolute top-0 right-0 w-[200px] h-[200px] bg-primary/5 blur-[60px] rounded-full -mr-20 -mt-20 pointer-events-none" />
        </div>

  
      </div>

      {/* Main Analytics: Power Decay Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="lg:col-span-2 bg-card border border-white/5 rounded-3xl p-8">
          <div className="flex justify-between items-center mb-10">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest opacity-40 mb-1">Power Usage Analytics</p>
              <h3 className="text-2xl font-black tracking-tight uppercase">SCU USAGE</h3>
            </div>
            <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded bg-[#22c55e]" />
                    <span className="text-[10px] font-bold opacity-40 uppercase">Owned CAU capacity</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded bg-[#ff69b4]" />
                    <span className="text-[10px] font-bold opacity-40 uppercase">Borrowed CAU capacity</span>
                </div>
            </div>
          </div>

          <div className="h-[350px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={decayData}>
                <defs>
                  <linearGradient id="greenBg" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#22c55e" stopOpacity={0.6} />
                    <stop offset="100%" stopColor="#22c55e" stopOpacity={0.1} />
                  </linearGradient>
                  <linearGradient id="pinkBg" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#831843" stopOpacity={0.9} />
                    <stop offset="100%" stopColor="#ff69b4" stopOpacity={0.2} />
                  </linearGradient>
                </defs>
                <ReferenceArea y1={25} fill="url(#greenBg)" />
                <ReferenceLine y={25} stroke="#22c55e" strokeOpacity={0.5} strokeDasharray="3 3" />
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.03)" />
                <XAxis dataKey="time" stroke="rgba(255,255,255,0.2)" fontSize={10} tickLine={false} axisLine={false} dy={10} />
                <YAxis stroke="rgba(255,255,255,0.2)" fontSize={10} tickLine={false} axisLine={false} dx={-10} />
                <Tooltip
                  contentStyle={{ backgroundColor: "#0a0a0a", borderColor: "rgba(255,255,255,0.1)", borderRadius: "12px", fontSize: "10px" }}
                  itemStyle={{ color: "#ffffff" }}
                  cursor={{ stroke: 'rgba(255,255,255,0.2)', strokeWidth: 1, strokeDasharray: '5 5' }}
                />
                <Area
                  type="monotone"
                  dataKey="limit"
                  baseValue={25}
                  stroke="rgba(255,105,180,0.5)"
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  fill="url(#pinkBg)"
                  fillOpacity={1}
                  animationDuration={2000}
                  activeDot={false}
                  name="Capacity Limit"
                />
                <Area
                  type="monotone"
                  dataKey="power"
                  stroke="rgba(255,255,255,0.5)"
                  strokeWidth={2}
                  fillOpacity={0}
                  animationDuration={2000}
                  name="CAU Usage"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          
          <div className="flex justify-end mt-6">
            <Link href="/dashboard/scu-usage">
              <Button variant="ghost" size="sm" className="h-6 text-[10px] uppercase font-bold tracking-widest text-primary hover:text-primary/80 hover:bg-primary/10">View More</Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Footer: Transmission History */}
      <div className="bg-card border border-white/5 rounded-3xl p-8">
        <div className="flex justify-between items-center mb-8">
          <h3 className="text-lg font-black tracking-tight uppercase">Network Transmission log</h3>
          <Button variant="ghost" className="text-[10px] font-bold uppercase">Protocol Export</Button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            { type: "Lend", val: "-500 SCU", time: "10:12", peer: "User_992" },
            { type: "Swap", val: "+1 Banana", time: "09:45", peer: "Central_Mart" },
          ].map((log, i) => (
            <div key={i} className="flex items-center justify-between p-4 rounded-2xl bg-white/[0.02] border border-white/5">
                <div className="flex items-center gap-3">
                    <div className="text-[8px] font-black px-2 py-1 bg-white/10 rounded uppercase">{log.type}</div>
                    <p className="text-[10px] font-bold uppercase">{log.peer}</p>
                </div>
                <div className="text-right">
                    <p className="text-[10px] font-black text-primary">{log.val}</p>
                    <p className="text-[8px] opacity-40 uppercase font-bold">{log.time} GMT</p>
                </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
