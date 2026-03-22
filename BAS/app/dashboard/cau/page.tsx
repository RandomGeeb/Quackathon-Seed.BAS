"use client";

import { useState } from "react";
import { ArrowLeft, Cpu, HardDrive, MemoryStick } from "lucide-react";
import Link from "next/link";

// ─── Data ──────────────────────────────────────────────────────────────────

type CAUType = "GPU" | "CPU" | "RAM";
type CAUTier = "S" | "A" | "B" | "C";
type CAUStatus = "active" | "idle" | "offline";

interface CAU {
  id: string;
  name: string;
  model: string;
  type: CAUType;
  tier: CAUTier;
  scu: number;           // total SCU capacity
  scuUsed: number;       // currently used SCU
  temp: number;          // °C
  clock: string;         // e.g. "2.52 GHz"
  power: number;         // watts draw
  utilPct: number;       // 0-100
  vram?: string;         // GPU only
  cores?: number;        // CPU only
  capacity?: string;     // RAM only
  status: CAUStatus;
  acquiredDate: string;
}

const caus: CAU[] = [
  {
    id: "CAU-001",
    name: "TITAN-ALPHA",
    model: "NVIDIA RTX 4090",
    type: "GPU",
    tier: "S",
    scu: 1200,
    scuUsed: 882,
    temp: 74,
    clock: "2.52 GHz",
    power: 418,
    utilPct: 73,
    vram: "24 GB GDDR6X",
    status: "active",
    acquiredDate: "2024-01-15",
  },
  {
    id: "CAU-002",
    name: "CORE-PRIME",
    model: "AMD Threadripper 5995WX",
    type: "CPU",
    tier: "S",
    scu: 480,
    scuUsed: 312,
    temp: 68,
    clock: "4.5 GHz",
    power: 280,
    utilPct: 65,
    cores: 64,
    status: "active",
    acquiredDate: "2024-01-15",
  },
  {
    id: "CAU-003",
    name: "VEGA-NODE",
    model: "NVIDIA RTX 3080",
    type: "GPU",
    tier: "A",
    scu: 680,
    scuUsed: 204,
    temp: 61,
    clock: "1.71 GHz",
    power: 320,
    utilPct: 30,
    vram: "10 GB GDDR6X",
    status: "active",
    acquiredDate: "2024-03-08",
  },
  {
    id: "CAU-004",
    name: "NEXUS-9K",
    model: "Intel Core i9-13900K",
    type: "CPU",
    tier: "B",
    scu: 220,
    scuUsed: 44,
    temp: 45,
    clock: "5.8 GHz",
    power: 125,
    utilPct: 20,
    cores: 24,
    status: "idle",
    acquiredDate: "2024-05-22",
  },
  {
    id: "CAU-005",
    name: "BUFFER-ECC",
    model: "DDR5-6400 64GB ECC",
    type: "RAM",
    tier: "A",
    scu: 120,
    scuUsed: 96,
    temp: 38,
    clock: "6400 MT/s",
    power: 12,
    utilPct: 80,
    capacity: "64 GB ECC",
    status: "active",
    acquiredDate: "2024-01-15",
  },
  {
    id: "CAU-006",
    name: "CACHE-32",
    model: "DDR4-3600 32GB",
    type: "RAM",
    tier: "C",
    scu: 45,
    scuUsed: 9,
    temp: 32,
    clock: "3600 MT/s",
    power: 6,
    utilPct: 20,
    capacity: "32 GB",
    status: "idle",
    acquiredDate: "2024-07-03",
  },
];

// ─── Helpers ───────────────────────────────────────────────────────────────

const TYPE_COLOR: Record<CAUType, string> = {
  GPU: "#fa04fa",
  CPU: "#c084fc",
  RAM: "#22c55e",
};

const TIER_COLOR: Record<CAUTier, string> = {
  S: "#fbbf24",
  A: "#fa04fa",
  B: "#c084fc",
  C: "#22c55e",
};

const TIER_LABEL: Record<CAUTier, string> = {
  S: "TIER-S · ELITE",
  A: "TIER-A · HIGH",
  B: "TIER-B · MID",
  C: "TIER-C · ENTRY",
};

function TypeIcon({ type, className }: { type: CAUType; className?: string }) {
  if (type === "GPU") return <Cpu className={className} />;
  if (type === "CPU") return <HardDrive className={className} />;
  return <MemoryStick className={className} />;
}

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

function StatPill({ label, value, dim }: { label: string; value: string; dim?: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="font-mono text-[8px] text-white/55 tracking-[0.25em] uppercase">{label}</span>
      <div className="flex items-baseline gap-1">
        <span className="font-mono text-[11px] font-black text-white/90">{value}</span>
        {dim && <span className="font-mono text-[8px] text-white/55 uppercase">{dim}</span>}
      </div>
    </div>
  );
}

// ─── CAU Card ──────────────────────────────────────────────────────────────

function CAUCard({ cau }: { cau: CAU }) {
  const typeColor = TYPE_COLOR[cau.type];
  const tierColor = TIER_COLOR[cau.tier];
  const isActive = cau.status === "active";

  return (
    <div className="relative bg-[#0d0d0d] border border-white/[0.06] p-6 flex flex-col gap-5 hover:border-white/[0.12] transition-colors overflow-hidden">
      <CornerMarks />

      {/* Faint type glow strip */}
      <div
        className="absolute top-0 left-0 right-0 h-px opacity-60"
        style={{ background: `linear-gradient(90deg, transparent, ${typeColor}40, transparent)` }}
      />

      {/* Header row */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          {/* Type icon box */}
          <div
            className="flex h-9 w-9 items-center justify-center border shrink-0"
            style={{ borderColor: `${typeColor}30`, backgroundColor: `${typeColor}08` }}
          >
            <TypeIcon type={cau.type} className="h-3.5 w-3.5" style={{ color: typeColor } as React.CSSProperties} />
          </div>
          <div>
            <p className="font-mono text-[9px] text-white/55 tracking-[0.3em] uppercase">{cau.id}</p>
            <p className="font-mono text-sm font-black tracking-tight text-white uppercase">{cau.name}</p>
          </div>
        </div>
        <div className="flex flex-col items-end gap-1">
          {/* Status */}
          <div className="flex items-center gap-1.5">
            <div
              className={`w-1.5 h-1.5 ${isActive ? "animate-pulse" : "opacity-25"}`}
              style={{ backgroundColor: isActive ? typeColor : "rgba(255,255,255,0.3)" }}
            />
            <span className="font-mono text-[8px] text-white/60 uppercase tracking-[0.25em]">{cau.status}</span>
          </div>
          {/* Tier badge */}
          <div
            className="border px-2 py-0.5"
            style={{ borderColor: `${tierColor}40`, backgroundColor: `${tierColor}08` }}
          >
            <span className="font-mono text-[8px] font-black tracking-[0.2em]" style={{ color: tierColor }}>
              {cau.tier}
            </span>
          </div>
        </div>
      </div>

      {/* Model line */}
      <div className="flex items-center gap-3">
        <div className="h-px flex-1 bg-white/[0.04]" />
        <span className="font-mono text-[9px] text-white/55 uppercase tracking-widest">{cau.model}</span>
        <div className="h-px flex-1 bg-white/[0.04]" />
      </div>

      {/* SCU — the big number */}
      <div>
        <p className="font-mono text-[8px] text-white/55 tracking-[0.3em] uppercase mb-0.5">Standard Compute Units</p>
        <div className="flex items-baseline gap-2">
          <span className="font-mono text-4xl font-black tracking-tighter" style={{ color: typeColor }}>
            {cau.scu.toLocaleString()}
          </span>
          <span className="font-mono text-xs text-white/55 uppercase tracking-[0.2em]">SCU</span>
        </div>
        {/* SCU usage bar */}
        <div className="mt-3 space-y-1">
          <div className="h-0.5 bg-white/[0.08]">
            <div
              className="h-full transition-all duration-700"
              style={{
                width: `${Math.round((cau.scuUsed / cau.scu) * 100)}%`,
                backgroundColor: typeColor,
                boxShadow: `0 0 6px ${typeColor}`,
              }}
            />
          </div>
          <div className="flex justify-between">
            <span className="font-mono text-[8px] text-white/55 uppercase tracking-wider">In Use</span>
            <span className="font-mono text-[8px] font-black" style={{ color: typeColor }}>
              {cau.scuUsed.toLocaleString()} / {cau.scu.toLocaleString()}
            </span>
          </div>
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-3 gap-4 border-t border-white/[0.04] pt-4">
        <StatPill label="Util" value={`${cau.utilPct}%`} />
        <StatPill label="Temp" value={`${cau.temp}°`} dim="C" />
        <StatPill label="Power" value={`${cau.power}`} dim="W" />
      </div>

      {/* Type-specific detail */}
      <div className="flex items-center justify-between border border-white/[0.08] bg-white/[0.03] px-3 py-2">
        {cau.vram && (
          <>
            <span className="font-mono text-[8px] text-white/55 tracking-[0.25em] uppercase">VRAM</span>
            <span className="font-mono text-[9px] font-black text-white/80 uppercase tracking-tight">{cau.vram}</span>
          </>
        )}
        {cau.cores && (
          <>
            <span className="font-mono text-[8px] text-white/55 tracking-[0.25em] uppercase">CORES</span>
            <span className="font-mono text-[9px] font-black text-white/80 uppercase tracking-tight">{cau.cores}C · {cau.clock}</span>
          </>
        )}
        {cau.capacity && (
          <>
            <span className="font-mono text-[8px] text-white/55 tracking-[0.25em] uppercase">CAPACITY</span>
            <span className="font-mono text-[9px] font-black text-white/80 uppercase tracking-tight">{cau.capacity}</span>
          </>
        )}
      </div>

      {/* Acquired date */}
      <p className="font-mono text-[8px] text-white/45 tracking-[0.2em] uppercase">
        ACQ · {cau.acquiredDate}
      </p>
    </div>
  );
}

// ─── Page ──────────────────────────────────────────────────────────────────

type FilterType = "ALL" | CAUType;

export default function CAUPage() {
  const [filter, setFilter] = useState<FilterType>("ALL");

  const totalSCU = caus.reduce((s, c) => s + c.scu, 0);
  const activeCount = caus.filter((c) => c.status === "active").length;

  const filtered = filter === "ALL" ? caus : caus.filter((c) => c.type === filter);

  const FILTERS: FilterType[] = ["ALL", "GPU", "CPU", "RAM"];

  return (
    <div className="flex flex-col gap-5 p-8 max-w-7xl mx-auto w-full">

      {/* Status bar */}
      <div className="relative flex items-center justify-between border border-white/[0.06] bg-[#0d0d0d] px-5 py-3">
        <CornerMarks />
        <div className="flex items-center gap-5">
          <Link href="/dashboard">
            <button className="flex items-center gap-2 font-mono text-[9px] text-white/55 hover:text-primary tracking-[0.25em] uppercase transition-colors">
              <ArrowLeft className="w-3 h-3" />
              BACK
            </button>
          </Link>
          <span className="font-mono text-[9px] text-white/40">·</span>
          <span className="font-mono text-[9px] text-white/45 tracking-[0.3em] uppercase">[CAU.000] · COMPUTING ASSET UNITS · INVENTORY</span>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 bg-primary animate-pulse" />
            <span className="font-mono text-[9px] text-primary/60 tracking-[0.25em]">LIVE.SYNC</span>
          </div>
        </div>
      </div>

      {/* Page title + summary */}
      <div className="relative bg-[#0d0d0d] border border-white/[0.06] px-7 py-5 flex items-end justify-between">
        <CornerMarks />
        <div>
          <p className="font-mono text-[8px] text-white/45 tracking-[0.35em] uppercase mb-1">Asset Registry // Owned Hardware</p>
          <h1 className="font-mono text-3xl font-black tracking-tighter uppercase text-white">CAU INVENTORY</h1>
        </div>
        <div className="flex items-end gap-10">
          <div className="text-right">
            <p className="font-mono text-[8px] text-white/45 tracking-[0.3em] uppercase mb-1">Total SCU Capacity</p>
            <p className="font-mono text-2xl font-black tracking-tighter text-white">
              {totalSCU.toLocaleString()}
              <span className="font-mono text-sm text-white/35 ml-2 uppercase">SCU</span>
            </p>
          </div>
          <div className="text-right">
            <p className="font-mono text-[8px] text-white/45 tracking-[0.3em] uppercase mb-1">Active Units</p>
            <p className="font-mono text-2xl font-black tracking-tighter text-white">
              {activeCount}
              <span className="font-mono text-sm text-white/35 ml-2 uppercase">/ {caus.length}</span>
            </p>
          </div>
        </div>
      </div>

      {/* Filter + grid */}
      <div>
        {/* Filter bar */}
        <div className="flex items-center gap-0 mb-5 border border-white/[0.06] self-start w-fit">
          {FILTERS.map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 font-mono text-[9px] uppercase tracking-[0.25em] transition-all border-r border-white/[0.06] last:border-r-0 ${
                filter === f
                  ? "bg-primary/10 text-primary"
                  : "text-white/40 hover:text-white/60 hover:bg-white/[0.02]"
              }`}
            >
              {f === "ALL" ? "ALL" : f}
              {f !== "ALL" && (
                <span className="ml-1.5 opacity-50">
                  [{caus.filter((c) => c.type === f).length}]
                </span>
              )}
            </button>
          ))}
        </div>

        {/* CAU cards grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((cau) => (
            <CAUCard key={cau.id} cau={cau} />
          ))}
        </div>
      </div>

      {/* Tier legend */}
      <div className="relative bg-[#0d0d0d] border border-white/[0.06] px-7 py-5">
        <CornerMarks />
        <div className="flex items-center justify-between flex-wrap gap-4">
          <span className="font-mono text-[8px] text-white/35 tracking-[0.35em] uppercase">[CAU.REF] // TIER CLASSIFICATION</span>
          <div className="flex items-center gap-6 flex-wrap">
            {(["S", "A", "B", "C"] as CAUTier[]).map((tier) => (
              <div key={tier} className="flex items-center gap-2">
                <div
                  className="w-3 h-3 border flex items-center justify-center"
                  style={{ borderColor: `${TIER_COLOR[tier]}50`, backgroundColor: `${TIER_COLOR[tier]}10` }}
                >
                  <span className="font-mono text-[7px] font-black" style={{ color: TIER_COLOR[tier] }}>{tier}</span>
                </div>
                <span className="font-mono text-[8px] text-white/60 uppercase tracking-[0.2em]">{TIER_LABEL[tier]}</span>
              </div>
            ))}
            <div className="h-3 w-px bg-white/[0.08]" />
            {(["GPU", "CPU", "RAM"] as CAUType[]).map((type) => (
              <div key={type} className="flex items-center gap-2">
                <div className="w-1.5 h-1.5" style={{ backgroundColor: TYPE_COLOR[type] }} />
                <span className="font-mono text-[8px] text-white/60 uppercase tracking-[0.2em]">{type}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

    </div>
  );
}
