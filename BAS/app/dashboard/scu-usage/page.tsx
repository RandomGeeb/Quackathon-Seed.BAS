"use client";

import { useState } from "react";
import { Activity, ArrowLeft, BarChart2, TrendingUp as TrendingUpIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
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
  {
    name: "Model Inference",
    key: "inference",
    color: "#ff69b4",
    compute: 24,
    loaned: 8,
    loanedFrom: "10:00",
    loanedTill: "10:45",
    pct: 46,
    status: "active",
    origin: "Node-Cluster-A",
  },
  {
    name: "Data Processing",
    key: "dataProcessing",
    color: "#a78bfa",
    compute: 14,
    loaned: 4,
    loanedFrom: "10:05",
    loanedTill: "11:00",
    pct: 27,
    status: "active",
    origin: "Node-Cluster-B",
  },
  {
    name: "Network Routing",
    key: "networkRouting",
    color: "#38bdf8",
    compute: 9,
    loaned: 0,
    loanedFrom: "—",
    loanedTill: "—",
    pct: 17,
    status: "active",
    origin: "Node-Cluster-A",
  },
  {
    name: "Storage I/O",
    key: "storageIO",
    color: "#22c55e",
    compute: 5,
    loaned: 2,
    loanedFrom: "09:50",
    loanedTill: "10:30",
    pct: 10,
    status: "idle",
    origin: "Node-Cluster-C",
  },
];

const TOTAL_CAPACITY = 60;

type ChartType = "bar" | "area";

export default function SCUUsagePage() {
  const [chartType, setChartType] = useState<ChartType>("bar");
  const totalCurrent = processes.reduce((s, p) => s + p.compute, 0);

  return (
    <div className="flex flex-col gap-8 p-8 max-w-7xl mx-auto w-full">
      {/* Back */}
      <div className="flex items-center gap-4">
        <Link href="/dashboard">
          <Button variant="ghost" size="sm" className="h-8 gap-2 text-[10px] uppercase font-bold tracking-widest opacity-60 hover:opacity-100">
            <ArrowLeft className="w-3 h-3" />
            Back
          </Button>
        </Link>
      </div>

      {/* Page Title */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center border border-primary/20">
            <Activity className="w-4 h-4 text-primary" />
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest opacity-40 mb-0.5">Power Usage Analytics</p>
            <h1 className="text-2xl font-black tracking-tight uppercase">SCU Usage</h1>
          </div>
        </div>
        <div className="text-right">
          <p className="text-[10px] font-bold uppercase tracking-widest opacity-40 mb-0.5">Total Active</p>
          <p className="text-2xl font-black tracking-tight">
            {totalCurrent}<span className="text-base opacity-20 ml-1">/ {TOTAL_CAPACITY} SCU</span>
          </p>
        </div>
      </div>

      {/* Chart Card */}
      <div className="bg-card border border-white/5 rounded-3xl p-8">
        <div className="flex justify-between items-start mb-10">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest opacity-40 mb-1">Breakdown by Process</p>
            <h3 className="text-xl font-black tracking-tight uppercase">Power Usage — Task Manager</h3>
          </div>
          <div className="flex flex-col items-end gap-4">
            {/* Toggle */}
            <div className="flex items-center gap-1 bg-white/5 rounded-xl p-1">
              <button
                onClick={() => setChartType("bar")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all ${
                  chartType === "bar" ? "bg-primary/20 text-primary" : "opacity-40 hover:opacity-70"
                }`}
              >
                <BarChart2 className="w-3 h-3" />
                Bar
              </button>
              <button
                onClick={() => setChartType("area")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all ${
                  chartType === "area" ? "bg-primary/20 text-primary" : "opacity-40 hover:opacity-70"
                }`}
              >
                <TrendingUpIcon className="w-3 h-3" />
                Area
              </button>
            </div>
            {/* Legend */}
            <div className="flex items-center gap-4 flex-wrap justify-end">
              {chartType === "bar" ? (
                processes.map((p) => (
                  <div key={p.key} className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded" style={{ backgroundColor: p.color }} />
                    <span className="text-[10px] font-bold opacity-40 uppercase">{p.name}</span>
                  </div>
                ))
              ) : (
                <>
                  <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded bg-[#22c55e]" />
                    <span className="text-[10px] font-bold opacity-40 uppercase">Owned CAU capacity</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded bg-[#ff69b4]" />
                    <span className="text-[10px] font-bold opacity-40 uppercase">Borrowed CAU capacity</span>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="h-[340px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            {chartType === "bar" ? (
              <BarChart data={chartData} barCategoryGap="30%">
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.03)" />
                <XAxis dataKey="time" stroke="rgba(255,255,255,0.2)" fontSize={10} tickLine={false} axisLine={false} dy={10} />
                <YAxis stroke="rgba(255,255,255,0.2)" fontSize={10} tickLine={false} axisLine={false} dx={-10} unit=" SCU" />
                <Tooltip
                  contentStyle={{ backgroundColor: "#0a0a0a", borderColor: "rgba(255,255,255,0.1)", borderRadius: "12px", fontSize: "10px" }}
                  itemStyle={{ color: "#ffffff" }}
                  cursor={{ fill: "rgba(255,255,255,0.03)" }}
                />
                {processes.map((p) => (
                  <Bar key={p.key} dataKey={p.key} stackId="a" fill={p.color} name={p.name} radius={p.key === "inference" ? [4, 4, 0, 0] : [0, 0, 0, 0]} />
                ))}
              </BarChart>
            ) : (
              <AreaChart data={chartData}>
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
                  cursor={{ stroke: "rgba(255,255,255,0.2)", strokeWidth: 1, strokeDasharray: "5 5" }}
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
            )}
          </ResponsiveContainer>
        </div>
      </div>

      {/* Usage Table */}
      <div className="bg-card border border-white/5 rounded-3xl p-8">
        <div className="mb-8">
          <p className="text-[10px] font-bold uppercase tracking-widest opacity-40 mb-1">Process Breakdown</p>
          <h3 className="text-xl font-black tracking-tight uppercase">Active Processes</h3>
        </div>

        {/* Table Header */}
        <div className="grid grid-cols-[2fr_1fr_1.5fr_2fr_1.5fr_1fr_1.5fr] gap-4 px-4 mb-3">
          {["Compute", "Compute Loaned", "Start", "End", "Load", "Status", "Origin"].map((h) => (
            <p key={h} className="text-[9px] font-bold uppercase tracking-widest opacity-30">{h}</p>
          ))}
        </div>

        <div className="flex flex-col gap-2">
          {processes.map((p) => (
            <div
              key={p.key}
              className="grid grid-cols-[2fr_1fr_1.5fr_2fr_1.5fr_1fr_1.5fr] gap-4 items-center px-4 py-3 rounded-2xl bg-white/2 border border-white/5"
            >
              {/* Compute */}
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: p.color }} />
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-tight">{p.name}</p>
                  <p className="text-[9px] font-black opacity-60" style={{ color: p.color }}>{p.compute} SCU</p>
                </div>
              </div>

              {/* Compute Loaned */}
              <p className="text-[11px] font-black opacity-60">
                {p.loaned > 0 ? `${p.loaned} SCU` : <span className="opacity-30">—</span>}
              </p>

              {/* Time Loaned From */}
              <p className="text-[11px] font-bold opacity-60">{p.loanedFrom}</p>

              {/* Till */}
              <p className="text-[11px] font-bold opacity-60">{p.loanedTill}</p>

              {/* Load bar */}
              <div className="flex items-center gap-2">
                <div className="flex-1 h-1 bg-white/5 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{ width: `${p.pct}%`, backgroundColor: p.color, boxShadow: `0 0 6px ${p.color}` }}
                  />
                </div>
                <span className="text-[9px] font-black opacity-40 w-7 text-right">{p.pct}%</span>
              </div>

              {/* Status */}
              <div className={`flex items-center gap-1.5 ${p.status === "active" ? "opacity-100" : "opacity-40"}`}>
                <div
                  className={`w-1.5 h-1.5 rounded-full ${p.status === "active" ? "animate-pulse" : ""}`}
                  style={{ backgroundColor: p.status === "active" ? p.color : "rgba(255,255,255,0.3)" }}
                />
                <span className="text-[9px] font-bold uppercase tracking-widest">{p.status}</span>
              </div>

              {/* Origin */}
              <p className="text-[10px] font-bold opacity-50 uppercase tracking-tight">{p.origin}</p>
            </div>
          ))}
        </div>

        {/* Footer totals */}
        <div className="grid grid-cols-[2fr_1fr_1.5fr_2fr_1.5fr_1fr_1.5fr] gap-4 px-4 mt-4 pt-4 border-t border-white/5 items-center">
          <p className="text-[9px] font-black uppercase tracking-widest opacity-60">Total</p>
          <p className="text-[11px] font-black text-primary">{processes.reduce((s, p) => s + p.loaned, 0)} SCU</p>
          <div />
          <div />
          <div className="flex items-center gap-2">
            <div className="flex-1 h-1 bg-white/5 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full bg-primary shadow-[0_0_6px_#ff69b4]"
                style={{ width: `${Math.round((totalCurrent / TOTAL_CAPACITY) * 100)}%` }}
              />
            </div>
            <span className="text-[9px] font-black opacity-40 w-7 text-right">{Math.round((totalCurrent / TOTAL_CAPACITY) * 100)}%</span>
          </div>
          <div />
          <div />
        </div>
      </div>
    </div>
  );
}
