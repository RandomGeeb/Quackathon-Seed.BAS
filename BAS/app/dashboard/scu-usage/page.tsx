"use client";

import { useState } from "react";
import { Activity, ArrowLeft, BarChart2, TrendingUp as TrendingUpIcon } from "lucide-react";
import {
  BarChart,
  Bar,
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
import Link from "next/link";

const chartData = [
  { time: "10:00", inference: 18, dataProcessing: 10, networkRouting: 7, storageIO: 5, power: 40, limit: 45 },
  { time: "10:05", inference: 6,  dataProcessing: 4,  networkRouting: 3, storageIO: 2, power: 15, limit: 60 },
  { time: "10:10", inference: 20, dataProcessing: 12, networkRouting: 8, storageIO: 5, power: 45, limit: 50 },
  { time: "10:15", inference: 8,  dataProcessing: 6,  networkRouting: 4, storageIO: 2, power: 20, limit: 58 },
  { time: "10:20", inference: 3,  dataProcessing: 2,  networkRouting: 2, storageIO: 1, power: 8,  limit: 42 },
  { time: "10:25", inference: 24, dataProcessing: 14, networkRouting: 9, storageIO: 5, power: 52, limit: 55 },
  { time: "10:30", inference: 10, dataProcessing: 8,  networkRouting: 5, storageIO: 2, power: 25, limit: 45 },
  { time: "10:35", inference: 4,  dataProcessing: 3,  networkRouting: 2, storageIO: 1, power: 10, limit: 50 },
];

const processes = [
  { name: "Model Inference",  key: "inference",     color: "#fa04fa", compute: 24, loaned: 8, loanedFrom: "10:00", loanedTill: "10:45", pct: 46, status: "active", origin: "Node-Cluster-A" },
  { name: "Data Processing",  key: "dataProcessing", color: "#fa04fa", compute: 14, loaned: 4, loanedFrom: "10:05", loanedTill: "11:00", pct: 27, status: "active", origin: "Node-Cluster-B" },
  { name: "Network Routing",  key: "networkRouting", color: "#c084fc", compute: 9,  loaned: 0, loanedFrom: "—",     loanedTill: "—",     pct: 17, status: "active", origin: "Node-Cluster-A" },
  { name: "Storage I/O",      key: "storageIO",      color: "#22c55e", compute: 5,  loaned: 2, loanedFrom: "09:50", loanedTill: "10:30", pct: 10, status: "idle",   origin: "Node-Cluster-C" },
];

const TOTAL_CAPACITY = 60;
type ChartType = "bar" | "area";

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

export default function SCUUsagePage() {
  const [chartType, setChartType] = useState<ChartType>("bar");
  const totalCurrent = processes.reduce((s, p) => s + p.compute, 0);

  return (
    <div className="flex flex-col gap-5 p-8 max-w-7xl mx-auto w-full">

      {/* Status bar */}
      <div className="relative flex items-center justify-between border border-white/6 bg-[#0d0d0d] px-5 py-3">
        <CornerMarks />
        <div className="flex items-center gap-5">
          <Link href="/dashboard">
            <button className="flex items-center gap-2 font-mono text-[9px] text-white/55 hover:text-primary tracking-[0.25em] uppercase transition-colors">
              <ArrowLeft className="w-3 h-3" />
              BACK
            </button>
          </Link>
          <span className="font-mono text-[9px] text-white/40">·</span>
          <span className="font-mono text-[9px] text-white/45 tracking-[0.3em] uppercase">[DAT.003] · SCU USAGE · TASK MANAGER</span>
        </div>
        <div className="flex items-center gap-2">
          <Activity className="w-3 h-3 text-primary/50" />
          <span className="font-mono text-[9px] text-primary/50 tracking-widest">{totalCurrent} / {TOTAL_CAPACITY} SCU</span>
        </div>
      </div>

      {/* Page title */}
      <div className="relative bg-[#0d0d0d] border border-white/6 px-7 py-5 flex items-end justify-between">
        <CornerMarks />
        <div>
          <p className="font-mono text-[8px] text-white/45 tracking-[0.35em] uppercase mb-1">Power Usage Analytics</p>
          <h1 className="font-mono text-3xl font-black tracking-tighter uppercase text-white">SCU USAGE</h1>
        </div>
        <div className="text-right">
          <p className="font-mono text-[8px] text-white/45 tracking-[0.3em] uppercase mb-1">Total Active</p>
          <p className="font-mono text-2xl font-black tracking-tighter text-white">
            {totalCurrent}
            <span className="font-mono text-base text-white/40 ml-2">/ {TOTAL_CAPACITY} SCU</span>
          </p>
        </div>
      </div>

      {/* Chart card */}
      <div className="relative bg-[#0d0d0d] border border-white/6 p-7">
        <CornerMarks />
        <div className="flex justify-between items-start mb-8">
          <div className="space-y-1">
            <span className="font-mono text-[8px] text-white/45 tracking-[0.35em] uppercase">[DAT.003.A] · BREAKDOWN BY PROCESS</span>
            <h3 className="font-mono text-xl font-black tracking-tighter uppercase text-white">Power Usage — Task Manager</h3>
          </div>
          <div className="flex flex-col items-end gap-3">
            {/* Toggle */}
            <div className="flex items-center gap-0 border border-white/8">
              <button
                onClick={() => setChartType("bar")}
                className={`flex items-center gap-1.5 px-3 py-1.5 font-mono text-[9px] uppercase tracking-[0.2em] transition-all border-r border-white/8 ${
                  chartType === "bar" ? "bg-primary/10 text-primary" : "text-white/50 hover:text-white/50"
                }`}
              >
                <BarChart2 className="w-3 h-3" />
                BAR
              </button>
              <button
                onClick={() => setChartType("area")}
                className={`flex items-center gap-1.5 px-3 py-1.5 font-mono text-[9px] uppercase tracking-[0.2em] transition-all ${
                  chartType === "area" ? "bg-primary/10 text-primary" : "text-white/50 hover:text-white/50"
                }`}
              >
                <TrendingUpIcon className="w-3 h-3" />
                AREA
              </button>
            </div>
            {/* Legend */}
            <div className="flex items-center gap-4 flex-wrap justify-end">
              {chartType === "bar" ? (
                processes.map((p) => (
                  <div key={p.key} className="flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5" style={{ backgroundColor: p.color }} />
                    <span className="font-mono text-[8px] text-white/50 uppercase tracking-widest">{p.name}</span>
                  </div>
                ))
              ) : (
                <>
                  <div className="flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 bg-[#22c55e]" />
                    <span className="font-mono text-[8px] text-white/50 uppercase tracking-widest">OWNED CAU</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 bg-primary" />
                    <span className="font-mono text-[8px] text-white/50 uppercase tracking-widest">BORROWED CAU</span>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="h-[320px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            {chartType === "bar" ? (
              <BarChart data={chartData} barCategoryGap="35%">
                <CartesianGrid strokeDasharray="1 6" vertical={false} stroke="rgba(255,255,255,0.04)" />
                <XAxis dataKey="time" stroke="rgba(255,255,255,0.12)" fontSize={9} tickLine={false} axisLine={false} dy={10} fontFamily="monospace" />
                <YAxis stroke="rgba(255,255,255,0.12)" fontSize={9} tickLine={false} axisLine={false} dx={-10} unit=" SCU" fontFamily="monospace" />
                <Tooltip
                  contentStyle={{ backgroundColor: "#0d0d0d", borderColor: "rgba(250,4,250,0.2)", borderRadius: "0", fontSize: "9px", fontFamily: "monospace" }}
                  itemStyle={{ color: "#e8e8e8" }}
                  labelStyle={{ color: "rgba(255,255,255,0.4)" }}
                  cursor={{ fill: "rgba(255,255,255,0.02)" }}
                />
                {processes.map((p) => (
                  <Bar key={p.key} dataKey={p.key} stackId="a" fill={p.color} name={p.name} radius={[0, 0, 0, 0]} fillOpacity={0.85} />
                ))}
              </BarChart>
            ) : (
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="greenBg2" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#22c55e" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="#22c55e" stopOpacity={0.03} />
                  </linearGradient>
                  <linearGradient id="pinkBg2" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#fa04fa" stopOpacity={0.25} />
                    <stop offset="100%" stopColor="#fa04fa" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <ReferenceArea y1={25} fill="url(#greenBg2)" />
                <ReferenceLine y={25} stroke="#22c55e" strokeOpacity={0.3} strokeDasharray="4 4" />
                <CartesianGrid strokeDasharray="1 6" vertical={false} stroke="rgba(255,255,255,0.04)" />
                <XAxis dataKey="time" stroke="rgba(255,255,255,0.12)" fontSize={9} tickLine={false} axisLine={false} dy={10} fontFamily="monospace" />
                <YAxis stroke="rgba(255,255,255,0.12)" fontSize={9} tickLine={false} axisLine={false} dx={-10} fontFamily="monospace" />
                <Tooltip
                  contentStyle={{ backgroundColor: "#0d0d0d", borderColor: "rgba(250,4,250,0.2)", borderRadius: "0", fontSize: "9px", fontFamily: "monospace" }}
                  itemStyle={{ color: "#fa04fa" }}
                  labelStyle={{ color: "rgba(255,255,255,0.4)" }}
                  cursor={{ stroke: "rgba(250,4,250,0.25)", strokeWidth: 1, strokeDasharray: "4 4" }}
                />
                <Area type="monotone" dataKey="limit" baseValue={25} stroke="rgba(250,4,250,0.4)" strokeWidth={1.5} strokeDasharray="5 5" fill="url(#pinkBg2)" fillOpacity={1} animationDuration={1500} activeDot={false} name="Capacity Limit" />
                <Area type="monotone" dataKey="power" stroke="rgba(255,255,255,0.35)" strokeWidth={1.5} fillOpacity={0} animationDuration={1500} name="CAU Usage" />
              </AreaChart>
            )}
          </ResponsiveContainer>
        </div>
      </div>

      {/* Process Table */}
      <div className="relative bg-[#0d0d0d] border border-white/6 p-7">
        <CornerMarks />
        <div className="mb-7 space-y-1">
          <span className="font-mono text-[8px] text-white/45 tracking-[0.35em] uppercase">[DAT.003.B] · PROCESS BREAKDOWN</span>
          <h3 className="font-mono text-xl font-black tracking-tighter uppercase text-white">Active Processes</h3>
        </div>

        {/* Table header */}
        <div className="grid grid-cols-[2fr_1fr_1fr_1fr_1.5fr_1fr_1.5fr] gap-4 px-4 pb-3 border-b border-white/5 mb-1">
          {["Compute", "Loaned", "Start", "End", "Load", "Status", "Origin"].map((h) => (
            <p key={h} className="font-mono text-[8px] text-white/45 tracking-[0.3em] uppercase">{h}</p>
          ))}
        </div>

        <div className="space-y-0.5">
          {processes.map((p) => (
            <div
              key={p.key}
              className="grid grid-cols-[2fr_1fr_1fr_1fr_1.5fr_1fr_1.5fr] gap-4 items-center px-4 py-3 border border-transparent hover:border-white/5 hover:bg-white/[0.01] transition-colors"
            >
              {/* Compute */}
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 shrink-0" style={{ backgroundColor: p.color }} />
                <div>
                  <p className="font-mono text-[10px] font-bold uppercase tracking-tight text-white/70">{p.name}</p>
                  <p className="font-mono text-[9px] font-black" style={{ color: p.color }}>{p.compute} SCU</p>
                </div>
              </div>

              {/* Loaned */}
              <p className="font-mono text-[10px] text-white/40">
                {p.loaned > 0 ? `${p.loaned} SCU` : "—"}
              </p>

              {/* Start */}
              <p className="font-mono text-[10px] text-white/55">{p.loanedFrom}</p>

              {/* End */}
              <p className="font-mono text-[10px] text-white/55">{p.loanedTill}</p>

              {/* Load */}
              <div className="flex items-center gap-2">
                <div className="flex-1 h-px bg-white/8">
                  <div
                    className="h-full transition-all duration-500"
                    style={{ width: `${p.pct}%`, backgroundColor: p.color }}
                  />
                </div>
                <span className="font-mono text-[9px] font-black text-white/55 w-7 text-right">{p.pct}%</span>
              </div>

              {/* Status */}
              <div className="flex items-center gap-1.5">
                <div
                  className={`w-1.5 h-1.5 ${p.status === "active" ? "animate-pulse" : "opacity-30"}`}
                  style={{ backgroundColor: p.status === "active" ? p.color : "rgba(255,255,255,0.3)" }}
                />
                <span className="font-mono text-[9px] uppercase tracking-widest" style={{ color: p.status === "active" ? "rgba(255,255,255,0.5)" : "rgba(255,255,255,0.2)" }}>
                  {p.status}
                </span>
              </div>

              {/* Origin */}
              <p className="font-mono text-[9px] text-white/55 uppercase tracking-tight">{p.origin}</p>
            </div>
          ))}
        </div>

        {/* Totals row */}
        <div className="grid grid-cols-[2fr_1fr_1fr_1fr_1.5fr_1fr_1.5fr] gap-4 px-4 mt-2 pt-4 border-t border-white/5 items-center">
          <p className="font-mono text-[9px] text-white/55 tracking-[0.3em] uppercase">Total</p>
          <p className="font-mono text-[10px] font-black text-primary">{processes.reduce((s, p) => s + p.loaned, 0)} SCU</p>
          <div /><div />
          <div className="flex items-center gap-2">
            <div className="flex-1 h-px bg-white/8">
              <div
                className="h-full bg-primary shadow-[0_0_6px_#fa04fa]"
                style={{ width: `${Math.round((totalCurrent / TOTAL_CAPACITY) * 100)}%` }}
              />
            </div>
            <span className="font-mono text-[9px] font-black text-white/55 w-7 text-right">{Math.round((totalCurrent / TOTAL_CAPACITY) * 100)}%</span>
          </div>
          <div /><div />
        </div>
      </div>

    </div>
  );
}
