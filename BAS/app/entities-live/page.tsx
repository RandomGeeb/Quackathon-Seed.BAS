"use client";

import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, Users, AlertTriangle, Coins, Landmark } from "lucide-react";
import Link from "next/link";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell,
} from "recharts";

const API_BASE = "http://127.0.0.1:8000/api";

type Entity = {
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

type EntityStockHolding = {
  entity_id: number;
  stock_id: number;
  ticker: string;
  name: string;
  shares_owned: number;
  avg_cost_basis: number;
  current_price: number;
  market_value: number;
};

type TickMetric = {
  tick: number;
  avg_stress: number;
  top_1_wealth_share: number;
  top_10_wealth_share: number;
};

const TYPE_COLORS: Record<string, string> = {
  individual: "#22c55e",
  small_corp: "#c084fc",
  large_business: "#fa04fa",
};

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

function computeMedian(values: number[]) {
  if (!values.length) return 0;
  const arr = [...values].sort((a, b) => a - b);
  const mid = Math.floor(arr.length / 2);
  return arr.length % 2 === 0 ? (arr[mid - 1] + arr[mid]) / 2 : arr[mid];
}

function stressTone(stress: number) {
  if (stress >= 0.75) return "text-red-400";
  if (stress >= 0.45) return "text-yellow-300";
  return "text-green-400";
}

export default function EntitiesLivePage() {
  const [entities, setEntities] = useState<Entity[]>([]);
  const [tickHistory, setTickHistory] = useState<TickMetric[]>([]);
  const [selectedEntityId, setSelectedEntityId] = useState<number | null>(null);
  const [selectedEntityStocks, setSelectedEntityStocks] = useState<EntityStockHolding[]>([]);
  const [loading, setLoading] = useState(true);

  async function loadCoreData() {
    try {
      const [entitiesRes, historyRes] = await Promise.all([
        fetch(`${API_BASE}/entities?limit=150`, { cache: "no-store" }),
        fetch(`${API_BASE}/history/ticks?limit=40`, { cache: "no-store" }),
      ]);

      const entitiesData = await entitiesRes.json();
      const historyData = await historyRes.json();

      const entityRows = Array.isArray(entitiesData) ? entitiesData : [];
      const historyRows = Array.isArray(historyData) ? [...historyData].reverse() : [];

      setEntities(entityRows);
      setTickHistory(historyRows);

      if (!selectedEntityId && entityRows.length > 0) {
        setSelectedEntityId(entityRows[0].id);
      }
    } catch (error) {
      console.error("Failed loading entities page", error);
    } finally {
      setLoading(false);
    }
  }

  async function loadSelectedEntityStocks(entityId: number) {
    try {
      const res = await fetch(`${API_BASE}/entities/${entityId}/stocks`, { cache: "no-store" });
      const data = await res.json();
      setSelectedEntityStocks(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Failed loading entity stock holdings", error);
      setSelectedEntityStocks([]);
    }
  }

  useEffect(() => {
    loadCoreData();
    const timer = setInterval(loadCoreData, 2500);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (selectedEntityId !== null) {
      loadSelectedEntityStocks(selectedEntityId);
    }
  }, [selectedEntityId]);

  const selectedEntity = useMemo(() => {
    return entities.find((e) => e.id === selectedEntityId) ?? null;
  }, [entities, selectedEntityId]);

  const leaderboard = useMemo(() => {
    return [...entities]
      .sort((a, b) => b.net_worth_estimate - a.net_worth_estimate)
      .slice(0, 15);
  }, [entities]);

  const groupedByType = useMemo(() => {
    const map = new Map<string, { type: string; wealth: number; count: number; avgStress: number }>();

    for (const entity of entities) {
      const current = map.get(entity.entity_type) ?? {
        type: entity.entity_type,
        wealth: 0,
        count: 0,
        avgStress: 0,
      };
      current.wealth += entity.net_worth_estimate;
      current.count += 1;
      current.avgStress += entity.stress;
      map.set(entity.entity_type, current);
    }

    return Array.from(map.values()).map((row) => ({
      ...row,
      avgStress: row.count > 0 ? row.avgStress / row.count : 0,
    }));
  }, [entities]);

  const stressBuckets = useMemo(() => {
    const buckets = [
      { label: "0.00-0.20", count: 0 },
      { label: "0.20-0.40", count: 0 },
      { label: "0.40-0.60", count: 0 },
      { label: "0.60-0.80", count: 0 },
      { label: "0.80-1.00", count: 0 },
    ];

    for (const entity of entities) {
      const s = entity.stress;
      if (s < 0.2) buckets[0].count += 1;
      else if (s < 0.4) buckets[1].count += 1;
      else if (s < 0.6) buckets[2].count += 1;
      else if (s < 0.8) buckets[3].count += 1;
      else buckets[4].count += 1;
    }

    return buckets;
  }, [entities]);

  const summary = useMemo(() => {
    const totalWealth = entities.reduce((sum, e) => sum + e.net_worth_estimate, 0);
    const totalCC = entities.reduce((sum, e) => sum + e.cc_balance, 0);
    const avgStress =
      entities.length > 0 ? entities.reduce((sum, e) => sum + e.stress, 0) / entities.length : 0;
    const medianWealth = computeMedian(entities.map((e) => e.net_worth_estimate));
    const distressedCount = entities.filter((e) => e.stress >= 0.75).length;

    return {
      totalWealth,
      totalCC,
      avgStress,
      medianWealth,
      distressedCount,
    };
  }, [entities]);

  if (loading) {
    return (
      <div className="flex flex-col gap-5 p-8 max-w-7xl mx-auto w-full">
        <div className="relative bg-[#0d0d0d] border border-white/6 px-7 py-8">
          <CornerMarks />
          <p className="font-mono text-[9px] text-white/50 tracking-[0.3em] uppercase">
            Loading entities...
          </p>
        </div>
      </div>
    );
  }

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
            [ENT.001] · ENTITY MONITOR · LIVE BALANCE SHEETS
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Users className="w-3 h-3 text-primary/50" />
          <span className="font-mono text-[9px] text-primary/50 tracking-widest">
            {entities.length} ENTITIES
          </span>
        </div>
      </div>

      {/* Title */}
      <div className="relative bg-[#0d0d0d] border border-white/6 px-7 py-5 flex items-end justify-between">
        <CornerMarks />
        <div>
          <p className="font-mono text-[8px] text-white/45 tracking-[0.35em] uppercase mb-1">
            Entity Monitor // Wealth, Liquidity and Exposure
          </p>
          <h1 className="font-mono text-3xl font-black tracking-tighter uppercase text-white">
            ENTITY LIVE
          </h1>
        </div>
        <div className="flex items-end gap-10">
          <div className="text-right">
            <p className="font-mono text-[8px] text-white/45 tracking-[0.3em] uppercase mb-1">
              Total Wealth
            </p>
            <p className="font-mono text-2xl font-black tracking-tighter text-white">
              {formatNumber(summary.totalWealth, 0)}
              <span className="font-mono text-sm text-white/35 ml-2 uppercase">CC</span>
            </p>
          </div>
          <div className="text-right">
            <p className="font-mono text-[8px] text-white/45 tracking-[0.3em] uppercase mb-1">
              Distressed
            </p>
            <p className="font-mono text-2xl font-black tracking-tighter text-red-400">
              {summary.distressedCount}
            </p>
          </div>
        </div>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        <div className="relative bg-[#0d0d0d] border border-white/6 px-5 py-4">
          <CornerMarks />
          <p className="font-mono text-[8px] text-white/45 tracking-[0.3em] uppercase mb-1">Average Stress</p>
          <p className={`font-mono text-2xl font-black tracking-tighter ${stressTone(summary.avgStress)}`}>
            {summary.avgStress.toFixed(3)}
          </p>
          <p className="font-mono text-[9px] text-white/45 tracking-[0.2em] uppercase mt-1">
            Population-wide pressure
          </p>
        </div>

        <div className="relative bg-[#0d0d0d] border border-white/6 px-5 py-4">
          <CornerMarks />
          <p className="font-mono text-[8px] text-white/45 tracking-[0.3em] uppercase mb-1">Median Wealth</p>
          <p className="font-mono text-2xl font-black tracking-tighter text-white">
            {formatNumber(summary.medianWealth, 0)}
          </p>
          <p className="font-mono text-[9px] text-white/45 tracking-[0.2em] uppercase mt-1">
            Typical entity balance sheet
          </p>
        </div>

        <div className="relative bg-[#0d0d0d] border border-white/6 px-5 py-4">
          <CornerMarks />
          <p className="font-mono text-[8px] text-white/45 tracking-[0.3em] uppercase mb-1">Total CC</p>
          <p className="font-mono text-2xl font-black tracking-tighter text-white">
            {formatNumber(summary.totalCC, 0)}
          </p>
          <p className="font-mono text-[9px] text-white/45 tracking-[0.2em] uppercase mt-1">
            Liquid currency in entities
          </p>
        </div>

        <div className="relative bg-[#0d0d0d] border border-white/6 px-5 py-4">
          <CornerMarks />
          <p className="font-mono text-[8px] text-white/45 tracking-[0.3em] uppercase mb-1">Top Entity</p>
          <p className="font-mono text-2xl font-black tracking-tighter text-primary">
            {leaderboard[0]?.name ?? "—"}
          </p>
          <p className="font-mono text-[9px] text-white/45 tracking-[0.2em] uppercase mt-1">
            Wealth leader
          </p>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 xl:grid-cols-[1.2fr_0.9fr] gap-5">
        <div className="relative bg-[#0d0d0d] border border-white/6 p-7">
          <CornerMarks />
          <div className="mb-7 space-y-1">
            <span className="font-mono text-[8px] text-white/45 tracking-[0.35em] uppercase">
              [ENT.001.A] · TYPE BREAKDOWN
            </span>
            <h3 className="font-mono text-xl font-black tracking-tighter uppercase text-white">
              Wealth by Entity Type
            </h3>
            <p className="font-mono text-[9px] text-white/40 tracking-[0.15em] uppercase">
              Current balance-sheet mass by population class
            </p>
          </div>

          <div className="h-[320px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={groupedByType}>
                <CartesianGrid strokeDasharray="1 6" vertical={false} stroke="rgba(255,255,255,0.04)" />
                <XAxis
                  dataKey="type"
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
                <Bar dataKey="wealth" name="Wealth">
                  {groupedByType.map((row) => (
                    <Cell key={row.type} fill={TYPE_COLORS[row.type] ?? "#fa04fa"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="relative bg-[#0d0d0d] border border-white/6 p-7">
          <CornerMarks />
          <div className="mb-7 space-y-1">
            <span className="font-mono text-[8px] text-white/45 tracking-[0.35em] uppercase">
              [ENT.001.B] · PRESSURE
            </span>
            <h3 className="font-mono text-xl font-black tracking-tighter uppercase text-white">
              Stress Distribution
            </h3>
            <p className="font-mono text-[9px] text-white/40 tracking-[0.15em] uppercase">
              Number of entities in each stress band
            </p>
          </div>

          <div className="h-[320px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={stressBuckets}
                  dataKey="count"
                  nameKey="label"
                  innerRadius={70}
                  outerRadius={110}
                  paddingAngle={2}
                >
                  <Cell fill="#22c55e" />
                  <Cell fill="#84cc16" />
                  <Cell fill="#eab308" />
                  <Cell fill="#f97316" />
                  <Cell fill="#ef4444" />
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#0d0d0d",
                    borderColor: "rgba(250,4,250,0.2)",
                    borderRadius: "0",
                    fontSize: "9px",
                    fontFamily: "monospace",
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Leaderboard + selected entity */}
      <div className="grid grid-cols-1 xl:grid-cols-[1.1fr_0.9fr] gap-5">
        <div className="relative bg-[#0d0d0d] border border-white/6 p-7">
          <CornerMarks />
          <div className="mb-7 space-y-1">
            <span className="font-mono text-[8px] text-white/45 tracking-[0.35em] uppercase">
              [ENT.001.C] · RANKING
            </span>
            <h3 className="font-mono text-xl font-black tracking-tighter uppercase text-white">
              Wealth Leaderboard
            </h3>
            <p className="font-mono text-[9px] text-white/40 tracking-[0.15em] uppercase">
              Click a row to inspect the entity
            </p>
          </div>

          <div className="grid grid-cols-[1.8fr_1fr_1fr_1fr_1fr] gap-4 px-4 pb-3 border-b border-white/5 mb-1">
            {["Entity", "Type", "CC", "Stress", "Net Worth"].map((h) => (
              <p key={h} className="font-mono text-[8px] text-white/45 tracking-[0.3em] uppercase">
                {h}
              </p>
            ))}
          </div>

          <div className="space-y-0.5">
            {leaderboard.map((entity) => (
              <button
                key={entity.id}
                onClick={() => setSelectedEntityId(entity.id)}
                className={`w-full text-left grid grid-cols-[1.8fr_1fr_1fr_1fr_1fr] gap-4 items-center px-4 py-3 border transition-colors ${
                  selectedEntityId === entity.id
                    ? "border-primary/30 bg-primary/5"
                    : "border-transparent hover:border-white/5 hover:bg-white/[0.01]"
                }`}
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
                <p className={`font-mono text-[10px] ${stressTone(entity.stress)}`}>
                  {entity.stress.toFixed(2)}
                </p>
                <p className="font-mono text-[10px] font-black text-primary">
                  {formatNumber(entity.net_worth_estimate, 0)}
                </p>
              </button>
            ))}
          </div>
        </div>

        <div className="relative bg-[#0d0d0d] border border-white/6 p-7">
          <CornerMarks />
          <div className="mb-7 space-y-1">
            <span className="font-mono text-[8px] text-white/45 tracking-[0.35em] uppercase">
              [ENT.001.D] · DETAIL
            </span>
            <h3 className="font-mono text-xl font-black tracking-tighter uppercase text-white">
              Selected Entity
            </h3>
            <p className="font-mono text-[9px] text-white/40 tracking-[0.15em] uppercase">
              Balance sheet and stock portfolio
            </p>
          </div>

          {selectedEntity ? (
            <div className="space-y-4">
              <div className="border border-white/[0.08] bg-white/[0.02] px-4 py-4">
                <p className="font-mono text-[11px] font-black uppercase text-white/85">
                  {selectedEntity.name}
                </p>
                <p className="font-mono text-[8px] text-white/45 uppercase tracking-[0.15em] mt-1">
                  {selectedEntity.entity_type} · {selectedEntity.strategy} · {selectedEntity.size_band}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: "CC", value: formatNumber(selectedEntity.cc_balance, 0), icon: Coins },
                  { label: "CAU", value: formatNumber(selectedEntity.cau_holdings, 2), icon: Landmark },
                  { label: "SCU INV", value: formatNumber(selectedEntity.scu_inventory, 2), icon: Users },
                  { label: "STRESS", value: selectedEntity.stress.toFixed(3), icon: AlertTriangle },
                ].map((item) => {
                  const Icon = item.icon;
                  return (
                    <div key={item.label} className="border border-white/[0.08] bg-white/[0.02] px-4 py-3">
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-[8px] text-white/55 tracking-[0.25em] uppercase">
                          {item.label}
                        </span>
                        <Icon className="w-3.5 h-3.5 text-primary/50" />
                      </div>
                      <p className="font-mono text-[12px] font-black text-white mt-2">{item.value}</p>
                    </div>
                  );
                })}
              </div>

              <div className="border border-white/[0.08] bg-white/[0.02] px-4 py-4">
                <p className="font-mono text-[8px] text-white/55 tracking-[0.25em] uppercase mb-3">
                  Stock Holdings
                </p>

                {selectedEntityStocks.length === 0 ? (
                  <p className="font-mono text-[9px] text-white/35 uppercase tracking-[0.15em]">
                    No stock holdings
                  </p>
                ) : (
                  <div className="space-y-2">
                    {selectedEntityStocks.slice(0, 8).map((holding) => (
                      <div
                        key={`${holding.entity_id}-${holding.stock_id}`}
                        className="flex items-center justify-between border border-white/[0.06] px-3 py-2"
                      >
                        <div>
                          <p className="font-mono text-[10px] font-black text-primary">{holding.ticker}</p>
                          <p className="font-mono text-[8px] text-white/35 uppercase tracking-[0.12em]">
                            {holding.name}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-mono text-[9px] text-white/70">
                            {formatNumber(holding.shares_owned, 2)} shares
                          </p>
                          <p className="font-mono text-[8px] text-white/40">
                            {formatNumber(holding.market_value, 0)} CC
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <p className="font-mono text-[9px] text-white/35 uppercase tracking-[0.15em]">
              No entity selected
            </p>
          )}
        </div>
      </div>
    </div>
  );
}