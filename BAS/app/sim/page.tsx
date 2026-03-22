"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  ArrowLeft,
  BarChart2,
  Coins,
  TrendingUp,
  Users,
  AlertTriangle,
} from "lucide-react";
import Link from "next/link";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
} from "recharts";

// ─── Types ─────────────────────────────────────────────────────────────────

type Snapshot = {
  world: {
    current_tick: number;
    tick_seconds: number;
    sim_running: boolean;
    scu_price: number;
    total_entities: number;
    active_events: number;
  };
  market: {
    scu_price: number;
    total_supply: number;
    total_demand: number;
    traded_volume: number;
    shortage_ratio: number;
    volatility: number;
  };
  top_entities: EntitySummary[];
  events: ActiveEvent[];
};

type EntitySummary = {
  id: number;
  name: string;
  entity_type: string;
  strategy: string;
  size_band: string;
  cc_balance: number;
  cau_holdings: number;
  scu_inventory: number;
  scu_reserved: number;
  reserve_target_cc: number;
  stress: number;
  unmet_scu_demand: number;
  net_worth_estimate: number;
};

type ActiveEvent = {
  id: number;
  event_type: string;
  name: string;
  description: string;
  start_tick: number;
  end_tick: number;
  source: string;
};

type TickMetric = {
  tick: number;
  scu_price: number;
  total_cc: number;
  total_cau: number;
  total_scu_inventory: number;
  total_scu_reserved: number;
  total_supply: number;
  total_demand: number;
  traded_volume: number;
  avg_stress: number;
  top_1_wealth_share: number;
  top_10_wealth_share: number;
  active_event_count: number;
};

const API_BASE = "http://127.0.0.1:8000/api";

// ─── Helpers ───────────────────────────────────────────────────────────────

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

function formatNumber(value: number, digits = 2) {
  return value.toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: digits,
  });
}

function pct(value: number, digits = 1) {
  return `${(value * 100).toFixed(digits)}%`;
}

function computeGini(values: number[]) {
  const arr = values.filter((v) => v >= 0).sort((a, b) => a - b);
  const n = arr.length;
  if (n === 0) return 0;

  const total = arr.reduce((s, v) => s + v, 0);
  if (total === 0) return 0;

  let weightedSum = 0;
  for (let i = 0; i < n; i++) {
    weightedSum += (i + 1) * arr[i];
  }

  return (2 * weightedSum) / (n * total) - (n + 1) / n;
}

function computeMedian(values: number[]) {
  if (values.length === 0) return 0;
  const arr = [...values].sort((a, b) => a - b);
  const mid = Math.floor(arr.length / 2);
  return arr.length % 2 === 0 ? (arr[mid - 1] + arr[mid]) / 2 : arr[mid];
}

function buildWealthBuckets(entities: EntitySummary[]) {
  if (!entities.length) return [];

  const wealths = entities.map((e) => e.net_worth_estimate);
  const min = Math.min(...wealths);
  const max = Math.max(...wealths);
  const bucketCount = 5;
  const range = Math.max(1, max - min);
  const step = range / bucketCount;

  const buckets = Array.from({ length: bucketCount }, (_, i) => {
    const start = min + i * step;
    const end = i === bucketCount - 1 ? max : min + (i + 1) * step;
    return {
      label: `${formatNumber(start, 0)}-${formatNumber(end, 0)}`,
      entities: 0,
      wealth: 0,
    };
  });

  for (const entity of entities) {
    const idx =
      step === 0
        ? 0
        : Math.min(bucketCount - 1, Math.floor((entity.net_worth_estimate - min) / step));
    buckets[idx].entities += 1;
    buckets[idx].wealth += entity.net_worth_estimate;
  }

  return buckets;
}

function buildTypeWealth(entities: EntitySummary[]) {
  const map = new Map<string, { type: string; wealth: number; count: number }>();

  for (const entity of entities) {
    const existing = map.get(entity.entity_type) ?? {
      type: entity.entity_type,
      wealth: 0,
      count: 0,
    };
    existing.wealth += entity.net_worth_estimate;
    existing.count += 1;
    map.set(entity.entity_type, existing);
  }

  return Array.from(map.values()).sort((a, b) => b.wealth - a.wealth);
}

function kpiTone(value: number, low: number, high: number) {
  if (value >= high) return "text-primary";
  if (value >= low) return "text-yellow-300";
  return "text-white";
}

// ─── Small UI blocks ───────────────────────────────────────────────────────

function KPIBlock({
  label,
  value,
  sub,
  icon,
}: {
  label: string;
  value: string;
  sub?: string;
  icon?: React.ReactNode;
}) {
  return (
    <div className="relative bg-[#0d0d0d] border border-white/6 px-5 py-4">
      <CornerMarks />
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-mono text-[8px] text-white/45 tracking-[0.3em] uppercase mb-1">{label}</p>
          <p className="font-mono text-2xl font-black tracking-tighter text-white">{value}</p>
          {sub && <p className="font-mono text-[9px] text-white/45 tracking-[0.2em] uppercase mt-1">{sub}</p>}
        </div>
        {icon && <div className="text-primary/55">{icon}</div>}
      </div>
    </div>
  );
}

function SectionHeader({
  code,
  title,
  subtitle,
}: {
  code: string;
  title: string;
  subtitle: string;
}) {
  return (
    <div className="mb-7 space-y-1">
      <span className="font-mono text-[8px] text-white/45 tracking-[0.35em] uppercase">{code}</span>
      <h3 className="font-mono text-xl font-black tracking-tighter uppercase text-white">{title}</h3>
      <p className="font-mono text-[9px] text-white/40 tracking-[0.15em] uppercase">{subtitle}</p>
    </div>
  );
}

// ─── Page ──────────────────────────────────────────────────────────────────

export default function SimPage() {
  const [snapshot, setSnapshot] = useState<Snapshot | null>(null);
  const [tickHistory, setTickHistory] = useState<TickMetric[]>([]);
  const [entities, setEntities] = useState<EntitySummary[]>([]);
  const [loading, setLoading] = useState(true);

  async function loadData() {
    try {
      const [snapshotRes, historyRes, entitiesRes] = await Promise.all([
        fetch(`${API_BASE}/snapshot`, { cache: "no-store" }),
        fetch(`${API_BASE}/history/ticks?limit=40`, { cache: "no-store" }),
        fetch(`${API_BASE}/entities?limit=150`, { cache: "no-store" }),
      ]);

      const snapshotData = await snapshotRes.json();
      const historyData = await historyRes.json();
      const entitiesData = await entitiesRes.json();

      setSnapshot(snapshotData);
      setTickHistory(Array.isArray(historyData) ? [...historyData].reverse() : []);
      setEntities(Array.isArray(entitiesData) ? entitiesData : []);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
    const timer = setInterval(loadData, 2500);
    return () => clearInterval(timer);
  }, []);

  const analytics = useMemo(() => {
    const wealths = entities.map((e) => e.net_worth_estimate);
    const totalWealth = wealths.reduce((s, v) => s + v, 0);
    const totalCC = entities.reduce((s, e) => s + e.cc_balance, 0);
    const avgStress =
      entities.length > 0 ? entities.reduce((s, e) => s + e.stress, 0) / entities.length : 0;

    const sorted = [...entities].sort((a, b) => b.net_worth_estimate - a.net_worth_estimate);
    const top1 = sorted[0]?.net_worth_estimate ?? 0;
    const top5 = sorted.slice(0, 5).reduce((s, e) => s + e.net_worth_estimate, 0);
    const medianWealth = computeMedian(wealths);
    const gini = computeGini(wealths);

    return {
      totalWealth,
      totalCC,
      avgStress,
      gini,
      medianWealth,
      top1Share: totalWealth > 0 ? top1 / totalWealth : 0,
      top5Share: totalWealth > 0 ? top5 / totalWealth : 0,
      wealthBuckets: buildWealthBuckets(entities),
      wealthByType: buildTypeWealth(entities),
      topWealthHolders: sorted.slice(0, 10),
    };
  }, [entities]);

  if (loading || !snapshot) {
    return (
      <div className="flex flex-col gap-5 p-8 max-w-7xl mx-auto w-full">
        <div className="relative bg-[#0d0d0d] border border-white/6 px-7 py-8">
          <CornerMarks />
          <p className="font-mono text-[9px] text-white/50 tracking-[0.3em] uppercase">
            Loading simulation monitor...
          </p>
        </div>
      </div>
    );
  }

  const latestTick = tickHistory[tickHistory.length - 1];
  const latestTop1Share = latestTick?.top_1_wealth_share ?? analytics.top1Share;
  const latestTop10Share = latestTick?.top_10_wealth_share ?? 0;
  const latestAvgStress = latestTick?.avg_stress ?? analytics.avgStress;

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
          <span className="font-mono text-[9px] text-white/45 tracking-[0.3em] uppercase">
            [SIM.001] · ECONOMY MONITOR · LIVE MARKET STATE
          </span>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 bg-primary animate-pulse" />
            <span className="font-mono text-[9px] text-primary/60 tracking-[0.25em]">
              LIVE.TICK
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Activity className="w-3 h-3 text-primary/50" />
            <span className="font-mono text-[9px] text-primary/50 tracking-widest">
              TICK {snapshot.world.current_tick}
            </span>
          </div>
        </div>
      </div>

      {/* Title bar */}
      <div className="relative bg-[#0d0d0d] border border-white/6 px-7 py-5 flex items-end justify-between">
        <CornerMarks />
        <div>
          <p className="font-mono text-[8px] text-white/45 tracking-[0.35em] uppercase mb-1">
            Macro Market Diagnostics // Wealth and Liquidity
          </p>
          <h1 className="font-mono text-3xl font-black tracking-tighter uppercase text-white">
            SIMULATION MONITOR
          </h1>
        </div>
        <div className="flex items-end gap-10">
          <div className="text-right">
            <p className="font-mono text-[8px] text-white/45 tracking-[0.3em] uppercase mb-1">
              SCU Spot Price
            </p>
            <p className="font-mono text-2xl font-black tracking-tighter text-white">
              {snapshot.market.scu_price.toFixed(2)}
              <span className="font-mono text-sm text-white/35 ml-2 uppercase">CC</span>
            </p>
          </div>
          <div className="text-right">
            <p className="font-mono text-[8px] text-white/45 tracking-[0.3em] uppercase mb-1">
              Active Events
            </p>
            <p className="font-mono text-2xl font-black tracking-tighter text-white">
              {snapshot.world.active_events}
              <span className="font-mono text-sm text-white/35 ml-2 uppercase">live</span>
            </p>
          </div>
        </div>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-4">
        <KPIBlock
          label="Gini Coefficient"
          value={analytics.gini.toFixed(3)}
          sub="Wealth inequality"
          icon={<Users className="w-4 h-4" />}
        />
        <KPIBlock
          label="Top 1 Wealth Share"
          value={pct(latestTop1Share)}
          sub="Concentration at the top"
          icon={<TrendingUp className="w-4 h-4" />}
        />
        <KPIBlock
          label="Top 10 Wealth Share"
          value={pct(latestTop10Share)}
          sub="Elite wealth concentration"
          icon={<BarChart2 className="w-4 h-4" />}
        />
        <KPIBlock
          label="Median Wealth"
          value={formatNumber(analytics.medianWealth, 0)}
          sub="Typical entity position"
          icon={<Coins className="w-4 h-4" />}
        />
        <KPIBlock
          label="Average Stress"
          value={latestAvgStress.toFixed(3)}
          sub="Liquidity / reserve pressure"
          icon={<AlertTriangle className="w-4 h-4" />}
        />
      </div>

      {/* Price and market pressure */}
      <div className="grid grid-cols-1 xl:grid-cols-[1.45fr_1fr] gap-5">
        <div className="relative bg-[#0d0d0d] border border-white/6 p-7">
          <CornerMarks />
          <SectionHeader
            code="[SIM.001.A] · PRICE DYNAMICS"
            title="SCU Price Over Time"
            subtitle="Spot price behaviour, volatility and regime shifts"
          />
          <div className="h-[320px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={tickHistory}>
                <defs>
                  <linearGradient id="priceFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#fa04fa" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="#fa04fa" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="1 6" vertical={false} stroke="rgba(255,255,255,0.04)" />
                <XAxis
                  dataKey="tick"
                  stroke="rgba(255,255,255,0.12)"
                  fontSize={9}
                  tickLine={false}
                  axisLine={false}
                  dy={10}
                  fontFamily="monospace"
                />
                <YAxis
                  stroke="rgba(255,255,255,0.12)"
                  fontSize={9}
                  tickLine={false}
                  axisLine={false}
                  dx={-10}
                  fontFamily="monospace"
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#0d0d0d",
                    borderColor: "rgba(250,4,250,0.2)",
                    borderRadius: "0",
                    fontSize: "9px",
                    fontFamily: "monospace",
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="scu_price"
                  stroke="#fa04fa"
                  strokeWidth={2}
                  fill="url(#priceFill)"
                  name="SCU Price"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="relative bg-[#0d0d0d] border border-white/6 p-7">
          <CornerMarks />
          <SectionHeader
            code="[SIM.001.B] · MARKET PRESSURE"
            title="Supply vs Demand"
            subtitle="Shortage conditions and clearing stress"
          />
          <div className="h-[320px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={tickHistory.slice(-16)} barCategoryGap="28%">
                <CartesianGrid strokeDasharray="1 6" vertical={false} stroke="rgba(255,255,255,0.04)" />
                <XAxis
                  dataKey="tick"
                  stroke="rgba(255,255,255,0.12)"
                  fontSize={9}
                  tickLine={false}
                  axisLine={false}
                  dy={10}
                  fontFamily="monospace"
                />
                <YAxis
                  stroke="rgba(255,255,255,0.12)"
                  fontSize={9}
                  tickLine={false}
                  axisLine={false}
                  dx={-10}
                  fontFamily="monospace"
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#0d0d0d",
                    borderColor: "rgba(250,4,250,0.2)",
                    borderRadius: "0",
                    fontSize: "9px",
                    fontFamily: "monospace",
                  }}
                />
                <Bar dataKey="total_supply" fill="#22c55e" name="Supply" />
                <Bar dataKey="total_demand" fill="#fa04fa" name="Demand" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Wealth concentration + stress */}
      <div className="grid grid-cols-1 xl:grid-cols-[1.35fr_1fr] gap-5">
        <div className="relative bg-[#0d0d0d] border border-white/6 p-7">
          <CornerMarks />
          <SectionHeader
            code="[SIM.001.C] · CONCENTRATION"
            title="Wealth Concentration Over Time"
            subtitle="Top-1 and top-10 wealth shares"
          />
          <div className="h-[320px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={tickHistory}>
                <CartesianGrid strokeDasharray="1 6" vertical={false} stroke="rgba(255,255,255,0.04)" />
                <XAxis
                  dataKey="tick"
                  stroke="rgba(255,255,255,0.12)"
                  fontSize={9}
                  tickLine={false}
                  axisLine={false}
                  dy={10}
                  fontFamily="monospace"
                />
                <YAxis
                  domain={[0, 1]}
                  stroke="rgba(255,255,255,0.12)"
                  fontSize={9}
                  tickFormatter={(v) => `${Math.round(v * 100)}%`}
                  tickLine={false}
                  axisLine={false}
                  dx={-10}
                  fontFamily="monospace"
                />
                <Tooltip
                  formatter={(value) =>
                    typeof value === "number" ? `${(value * 100).toFixed(1)}%` : String(value)
                }
                  contentStyle={{
                    backgroundColor: "#0d0d0d",
                    borderColor: "rgba(250,4,250,0.2)",
                    borderRadius: "0",
                    fontSize: "9px",
                    fontFamily: "monospace",
                  }}
                />
                <ReferenceLine
                  y={0.5}
                  stroke="rgba(255,255,255,0.15)"
                  strokeDasharray="4 4"
                />
                <Line
                  type="monotone"
                  dataKey="top_1_wealth_share"
                  stroke="#fa04fa"
                  strokeWidth={2}
                  dot={false}
                  name="Top 1 Share"
                />
                <Line
                  type="monotone"
                  dataKey="top_10_wealth_share"
                  stroke="#22c55e"
                  strokeWidth={2}
                  dot={false}
                  name="Top 10 Share"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="relative bg-[#0d0d0d] border border-white/6 p-7">
          <CornerMarks />
          <SectionHeader
            code="[SIM.001.D] · STRESS"
            title="Average Stress"
            subtitle="Reserve strain, shortages and liquidity pressure"
          />
          <div className="h-[320px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={tickHistory}>
                <defs>
                  <linearGradient id="stressFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#c084fc" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="#c084fc" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="1 6" vertical={false} stroke="rgba(255,255,255,0.04)" />
                <XAxis
                  dataKey="tick"
                  stroke="rgba(255,255,255,0.12)"
                  fontSize={9}
                  tickLine={false}
                  axisLine={false}
                  dy={10}
                  fontFamily="monospace"
                />
                <YAxis
                  domain={[0, 1]}
                  stroke="rgba(255,255,255,0.12)"
                  fontSize={9}
                  tickLine={false}
                  axisLine={false}
                  dx={-10}
                  fontFamily="monospace"
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#0d0d0d",
                    borderColor: "rgba(250,4,250,0.2)",
                    borderRadius: "0",
                    fontSize: "9px",
                    fontFamily: "monospace",
                  }}
                />
                <ReferenceLine y={0.7} stroke="#fa04fa" strokeDasharray="4 4" />
                <Area
                  type="monotone"
                  dataKey="avg_stress"
                  stroke="#c084fc"
                  strokeWidth={2}
                  fill="url(#stressFill)"
                  name="Average Stress"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Current wealth distribution */}
      <div className="grid grid-cols-1 xl:grid-cols-[1fr_1.15fr] gap-5">
        <div className="relative bg-[#0d0d0d] border border-white/6 p-7">
          <CornerMarks />
          <SectionHeader
            code="[SIM.001.E] · CURRENT DISTRIBUTION"
            title="Wealth Buckets"
            subtitle="How many entities sit in each wealth band"
          />
          <div className="h-[320px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={analytics.wealthBuckets}>
                <CartesianGrid strokeDasharray="1 6" vertical={false} stroke="rgba(255,255,255,0.04)" />
                <XAxis
                  dataKey="label"
                  stroke="rgba(255,255,255,0.12)"
                  fontSize={8}
                  tickLine={false}
                  axisLine={false}
                  dy={10}
                  fontFamily="monospace"
                  interval={0}
                  angle={-15}
                  textAnchor="end"
                  height={60}
                />
                <YAxis
                  stroke="rgba(255,255,255,0.12)"
                  fontSize={9}
                  tickLine={false}
                  axisLine={false}
                  dx={-10}
                  fontFamily="monospace"
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#0d0d0d",
                    borderColor: "rgba(250,4,250,0.2)",
                    borderRadius: "0",
                    fontSize: "9px",
                    fontFamily: "monospace",
                  }}
                />
                <Bar dataKey="entities" fill="#fa04fa" name="Entities" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="relative bg-[#0d0d0d] border border-white/6 p-7">
          <CornerMarks />
          <SectionHeader
            code="[SIM.001.F] · ENTITY TYPES"
            title="Wealth by Entity Class"
            subtitle="Where the balance sheet mass sits"
          />
          <div className="h-[320px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={analytics.wealthByType} layout="vertical">
                <CartesianGrid strokeDasharray="1 6" vertical={false} stroke="rgba(255,255,255,0.04)" />
                <XAxis
                  type="number"
                  stroke="rgba(255,255,255,0.12)"
                  fontSize={9}
                  tickLine={false}
                  axisLine={false}
                  fontFamily="monospace"
                />
                <YAxis
                  type="category"
                  dataKey="type"
                  stroke="rgba(255,255,255,0.12)"
                  fontSize={9}
                  tickLine={false}
                  axisLine={false}
                  width={110}
                  fontFamily="monospace"
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#0d0d0d",
                    borderColor: "rgba(250,4,250,0.2)",
                    borderRadius: "0",
                    fontSize: "9px",
                    fontFamily: "monospace",
                  }}
                />
                <Bar dataKey="wealth" fill="#22c55e" name="Total Wealth" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Rich list + live readings */}
      <div className="grid grid-cols-1 xl:grid-cols-[1.25fr_1fr] gap-5">
        <div className="relative bg-[#0d0d0d] border border-white/6 p-7">
          <CornerMarks />
          <SectionHeader
            code="[SIM.001.G] · RICH LIST"
            title="Top Wealth Holders"
            subtitle="Current leaders by net worth"
          />

          <div className="grid grid-cols-[1.9fr_1fr_1fr_1fr_1fr] gap-4 px-4 pb-3 border-b border-white/5 mb-1">
            {["Entity", "Type", "CC", "Stress", "Net Worth"].map((h) => (
              <p key={h} className="font-mono text-[8px] text-white/45 tracking-[0.3em] uppercase">
                {h}
              </p>
            ))}
          </div>

          <div className="space-y-0.5">
            {analytics.topWealthHolders.map((entity) => (
              <div
                key={entity.id}
                className="grid grid-cols-[1.9fr_1fr_1fr_1fr_1fr] gap-4 items-center px-4 py-3 border border-transparent hover:border-white/5 hover:bg-white/[0.01] transition-colors"
              >
                <div>
                  <p className="font-mono text-[10px] font-bold uppercase tracking-tight text-white/80">
                    {entity.name}
                  </p>
                  <p className="font-mono text-[8px] text-white/45 tracking-[0.15em] uppercase">
                    {entity.strategy}
                  </p>
                </div>

                <p className="font-mono text-[9px] text-white/55 uppercase">{entity.entity_type}</p>
                <p className="font-mono text-[10px] text-white/70">{formatNumber(entity.cc_balance, 0)}</p>
                <p
                  className={`font-mono text-[10px] ${kpiTone(entity.stress, 0.4, 0.75)}`}
                >
                  {entity.stress.toFixed(2)}
                </p>
                <p className="font-mono text-[10px] font-black text-primary">
                  {formatNumber(entity.net_worth_estimate, 0)}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="relative bg-[#0d0d0d] border border-white/6 p-7">
          <CornerMarks />
          <SectionHeader
            code="[SIM.001.H] · LIVE READINGS"
            title="Current Economy State"
            subtitle="Fast read of market and distribution"
          />

          <div className="space-y-4">
            {[
              {
                label: "Total Wealth",
                value: formatNumber(analytics.totalWealth, 0),
                tone: "text-white",
              },
              {
                label: "Total CC",
                value: formatNumber(analytics.totalCC, 0),
                tone: "text-white",
              },
              {
                label: "Current Shortage Ratio",
                value: snapshot.market.shortage_ratio.toFixed(3),
                tone: kpiTone(snapshot.market.shortage_ratio, 0.2, 0.45),
              },
              {
                label: "Current Volatility",
                value: snapshot.market.volatility.toFixed(3),
                tone: kpiTone(snapshot.market.volatility, 0.12, 0.25),
              },
              {
                label: "Top 5 Wealth Share",
                value: pct(analytics.top5Share),
                tone: kpiTone(analytics.top5Share, 0.35, 0.55),
              },
              {
                label: "Median / Mean Wealth",
                value: analytics.totalWealth > 0
                  ? (analytics.medianWealth / (analytics.totalWealth / Math.max(entities.length, 1))).toFixed(3)
                  : "0.000",
                tone: "text-white",
              },
            ].map((item) => (
              <div
                key={item.label}
                className="flex items-center justify-between border border-white/[0.08] bg-white/[0.02] px-4 py-3"
              >
                <span className="font-mono text-[8px] text-white/55 tracking-[0.25em] uppercase">
                  {item.label}
                </span>
                <span className={`font-mono text-[11px] font-black ${item.tone}`}>
                  {item.value}
                </span>
              </div>
            ))}
          </div>

          <div className="mt-6 border-t border-white/5 pt-5">
            <p className="font-mono text-[8px] text-white/45 tracking-[0.3em] uppercase mb-3">
              Active Events
            </p>
            <div className="space-y-2">
              {snapshot.events.length === 0 ? (
                <p className="font-mono text-[9px] text-white/35 uppercase tracking-[0.2em]">
                  No live shocks
                </p>
              ) : (
                snapshot.events.slice(0, 5).map((event) => (
                  <div
                    key={event.id}
                    className="border border-white/[0.08] bg-white/[0.02] px-4 py-3"
                  >
                    <p className="font-mono text-[9px] font-black uppercase tracking-[0.15em] text-white/80">
                      {event.name}
                    </p>
                    <p className="font-mono text-[8px] text-white/45 uppercase tracking-[0.12em] mt-1">
                      tick {event.start_tick} → {event.end_tick}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}