"use client";

import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, Activity, TrendingUp, TrendingDown, BarChart2 } from "lucide-react";
import Link from "next/link";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";

const API_BASE = "http://127.0.0.1:8000/api";

type Stock = {
  id: number;
  ticker: string;
  name: string;
  archetype: string;
  current_price: number;
  previous_price: number;
  target_price: number;
  shares_outstanding: number;
  current_regime: string;
  regime_ticks_remaining: number;
  sentiment: number;
};

type StockHistoryRow = {
  id?: number;
  tick: number;
  stock_id: number;
  ticker: string;
  price: number;
  shares_traded: number;
  volume_cc: number;
  regime: string;
  sentiment: number;
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

function archetypeLabel(value: string) {
  return value.replaceAll("_", " ").toUpperCase();
}

function regimeTone(regime: string) {
  if (regime === "breakout" || regime === "recovery") return "text-green-400";
  if (regime === "panic") return "text-red-400";
  return "text-white/60";
}

export default function StocksMarketPage() {
  const [stocks, setStocks] = useState<Stock[]>([]);
  const [history, setHistory] = useState<StockHistoryRow[]>([]);
  const [loading, setLoading] = useState(true);

  async function loadData() {
    try {
      const [stocksRes, historyRes] = await Promise.all([
        fetch(`${API_BASE}/stocks`, { cache: "no-store" }),
        fetch(`${API_BASE}/stocks/history?limit=400`, { cache: "no-store" }),
      ]);

      const stocksData = await stocksRes.json();
      const historyData = await historyRes.json();

      setStocks(Array.isArray(stocksData) ? stocksData : []);
      setHistory(Array.isArray(historyData) ? historyData : []);
    } catch (error) {
      console.error("Failed to load stock market page", error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
    const timer = setInterval(loadData, 2500);
    return () => clearInterval(timer);
  }, []);

  const enrichedStocks = useMemo(() => {
    return stocks.map((stock) => {
      const change = stock.current_price - stock.previous_price;
      const pctChange =
        stock.previous_price > 0 ? change / stock.previous_price : 0;

      return {
        ...stock,
        change,
        pctChange,
        marketCap: stock.current_price * stock.shares_outstanding,
      };
    });
  }, [stocks]);

  const sortedByMove = useMemo(() => {
    return [...enrichedStocks].sort((a, b) => b.pctChange - a.pctChange);
  }, [enrichedStocks]);

  const marketIndexHistory = useMemo(() => {
    const grouped = new Map<number, StockHistoryRow[]>();

    for (const row of history) {
      const arr = grouped.get(row.tick) ?? [];
      arr.push(row);
      grouped.set(row.tick, arr);
    }

    const ticks = Array.from(grouped.keys()).sort((a, b) => a - b);

    return ticks.map((tick) => {
      const rows = grouped.get(tick) ?? [];
      const avgPrice =
        rows.length > 0 ? rows.reduce((sum, r) => sum + r.price, 0) / rows.length : 0;
      const totalVolume = rows.reduce((sum, r) => sum + r.volume_cc, 0);
      return {
        tick,
        avgPrice,
        totalVolume,
      };
    });
  }, [history]);

  const totalMarketCap = enrichedStocks.reduce((sum, s) => sum + s.marketCap, 0);
  const avgSentiment =
    enrichedStocks.length > 0
      ? enrichedStocks.reduce((sum, s) => sum + s.sentiment, 0) / enrichedStocks.length
      : 0;
  const breakoutCount = enrichedStocks.filter((s) => s.current_regime === "breakout").length;
  const panicCount = enrichedStocks.filter((s) => s.current_regime === "panic").length;

  if (loading) {
    return (
      <div className="flex flex-col gap-5 p-8 max-w-7xl mx-auto w-full">
        <div className="relative bg-[#0d0d0d] border border-white/6 px-7 py-8">
          <CornerMarks />
          <p className="font-mono text-[9px] text-white/50 tracking-[0.3em] uppercase">
            Loading stock market...
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
            [EQT.001] · STOCK MARKET · OVERVIEW
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Activity className="w-3 h-3 text-primary/50" />
          <span className="font-mono text-[9px] text-primary/50 tracking-widest">
            {stocks.length} LISTED
          </span>
        </div>
      </div>

      {/* Title */}
      <div className="relative bg-[#0d0d0d] border border-white/6 px-7 py-5 flex items-end justify-between">
        <CornerMarks />
        <div>
          <p className="font-mono text-[8px] text-white/45 tracking-[0.35em] uppercase mb-1">
            Equity Monitor // Controlled Company Performance
          </p>
          <h1 className="font-mono text-3xl font-black tracking-tighter uppercase text-white">
            STOCK MARKET
          </h1>
        </div>
        <div className="flex items-end gap-10">
          <div className="text-right">
            <p className="font-mono text-[8px] text-white/45 tracking-[0.3em] uppercase mb-1">
              Total Market Cap
            </p>
            <p className="font-mono text-2xl font-black tracking-tighter text-white">
              {formatNumber(totalMarketCap, 0)}
              <span className="font-mono text-sm text-white/35 ml-2 uppercase">CC</span>
            </p>
          </div>
          <div className="text-right">
            <p className="font-mono text-[8px] text-white/45 tracking-[0.3em] uppercase mb-1">
              Avg Sentiment
            </p>
            <p className="font-mono text-2xl font-black tracking-tighter text-white">
              {avgSentiment.toFixed(3)}
            </p>
          </div>
        </div>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        <div className="relative bg-[#0d0d0d] border border-white/6 px-5 py-4">
          <CornerMarks />
          <p className="font-mono text-[8px] text-white/45 tracking-[0.3em] uppercase mb-1">Top Gainer</p>
          <p className="font-mono text-2xl font-black tracking-tighter text-green-400">
            {sortedByMove[0]?.ticker ?? "—"}
          </p>
          <p className="font-mono text-[9px] text-white/45 tracking-[0.2em] uppercase mt-1">
            {sortedByMove[0] ? `${(sortedByMove[0].pctChange * 100).toFixed(2)}%` : "No data"}
          </p>
        </div>

        <div className="relative bg-[#0d0d0d] border border-white/6 px-5 py-4">
          <CornerMarks />
          <p className="font-mono text-[8px] text-white/45 tracking-[0.3em] uppercase mb-1">Top Loser</p>
          <p className="font-mono text-2xl font-black tracking-tighter text-red-400">
            {sortedByMove[sortedByMove.length - 1]?.ticker ?? "—"}
          </p>
          <p className="font-mono text-[9px] text-white/45 tracking-[0.2em] uppercase mt-1">
            {sortedByMove.length
              ? `${(sortedByMove[sortedByMove.length - 1].pctChange * 100).toFixed(2)}%`
              : "No data"}
          </p>
        </div>

        <div className="relative bg-[#0d0d0d] border border-white/6 px-5 py-4">
          <CornerMarks />
          <p className="font-mono text-[8px] text-white/45 tracking-[0.3em] uppercase mb-1">Breakout Regimes</p>
          <p className="font-mono text-2xl font-black tracking-tighter text-green-400">
            {breakoutCount}
          </p>
          <p className="font-mono text-[9px] text-white/45 tracking-[0.2em] uppercase mt-1">
            Growth phase names
          </p>
        </div>

        <div className="relative bg-[#0d0d0d] border border-white/6 px-5 py-4">
          <CornerMarks />
          <p className="font-mono text-[8px] text-white/45 tracking-[0.3em] uppercase mb-1">Panic Regimes</p>
          <p className="font-mono text-2xl font-black tracking-tighter text-red-400">
            {panicCount}
          </p>
          <p className="font-mono text-[9px] text-white/45 tracking-[0.2em] uppercase mt-1">
            Crash pressure names
          </p>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 xl:grid-cols-[1.25fr_1fr] gap-5">
        <div className="relative bg-[#0d0d0d] border border-white/6 p-7">
          <CornerMarks />
          <div className="mb-7 space-y-1">
            <span className="font-mono text-[8px] text-white/45 tracking-[0.35em] uppercase">
              [EQT.001.A] · INDEX
            </span>
            <h3 className="font-mono text-xl font-black tracking-tighter uppercase text-white">
              Market Index
            </h3>
            <p className="font-mono text-[9px] text-white/40 tracking-[0.15em] uppercase">
              Average listed stock price over time
            </p>
          </div>

          <div className="h-[320px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={marketIndexHistory}>
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
                <Line
                  type="monotone"
                  dataKey="avgPrice"
                  stroke="#fa04fa"
                  strokeWidth={2}
                  dot={false}
                  name="Average Price"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="relative bg-[#0d0d0d] border border-white/6 p-7">
          <CornerMarks />
          <div className="mb-7 space-y-1">
            <span className="font-mono text-[8px] text-white/45 tracking-[0.35em] uppercase">
              [EQT.001.B] · LEADERS
            </span>
            <h3 className="font-mono text-xl font-black tracking-tighter uppercase text-white">
              Movers
            </h3>
            <p className="font-mono text-[9px] text-white/40 tracking-[0.15em] uppercase">
              Biggest gainers and losers by tick change
            </p>
          </div>

          <div className="space-y-3">
            {sortedByMove.slice(0, 5).map((stock) => (
              <div
                key={`gainer-${stock.ticker}`}
                className="flex items-center justify-between border border-white/[0.08] bg-white/[0.02] px-4 py-3"
              >
                <div className="flex items-center gap-3">
                  <TrendingUp className="w-3.5 h-3.5 text-green-400" />
                  <div>
                    <p className="font-mono text-[10px] font-black uppercase text-white/85">{stock.ticker}</p>
                    <p className="font-mono text-[8px] text-white/40 uppercase tracking-[0.15em]">
                      {stock.name}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-mono text-[10px] text-green-400 font-black">
                    +{(stock.pctChange * 100).toFixed(2)}%
                  </p>
                  <p className="font-mono text-[8px] text-white/40">
                    {formatNumber(stock.current_price)}
                  </p>
                </div>
              </div>
            ))}

            <div className="h-px bg-white/5 my-2" />

            {[...sortedByMove].reverse().slice(0, 5).map((stock) => (
              <div
                key={`loser-${stock.ticker}`}
                className="flex items-center justify-between border border-white/[0.08] bg-white/[0.02] px-4 py-3"
              >
                <div className="flex items-center gap-3">
                  <TrendingDown className="w-3.5 h-3.5 text-red-400" />
                  <div>
                    <p className="font-mono text-[10px] font-black uppercase text-white/85">{stock.ticker}</p>
                    <p className="font-mono text-[8px] text-white/40 uppercase tracking-[0.15em]">
                      {stock.name}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-mono text-[10px] text-red-400 font-black">
                    {(stock.pctChange * 100).toFixed(2)}%
                  </p>
                  <p className="font-mono text-[8px] text-white/40">
                    {formatNumber(stock.current_price)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Main stock table */}
      <div className="relative bg-[#0d0d0d] border border-white/6 p-7">
        <CornerMarks />
        <div className="mb-7 space-y-1">
          <span className="font-mono text-[8px] text-white/45 tracking-[0.35em] uppercase">
            [EQT.001.C] · LISTED STOCKS
          </span>
          <h3 className="font-mono text-xl font-black tracking-tighter uppercase text-white">
            Market Tape
          </h3>
          <p className="font-mono text-[9px] text-white/40 tracking-[0.15em] uppercase">
            Current state of all listed companies
          </p>
        </div>

        <div className="grid grid-cols-[0.9fr_1.8fr_1.2fr_1fr_1fr_1fr_1fr_1fr] gap-4 px-4 pb-3 border-b border-white/5 mb-1">
          {["Ticker", "Name", "Archetype", "Price", "Change", "Target", "Regime", "Mkt Cap"].map((h) => (
            <p key={h} className="font-mono text-[8px] text-white/45 tracking-[0.3em] uppercase">
              {h}
            </p>
          ))}
        </div>

        <div className="space-y-0.5">
          {enrichedStocks.map((stock) => (
            <div
              key={stock.ticker}
              className="grid grid-cols-[0.9fr_1.8fr_1.2fr_1fr_1fr_1fr_1fr_1fr] gap-4 items-center px-4 py-3 border border-transparent hover:border-white/5 hover:bg-white/[0.01] transition-colors"
            >
              <p className="font-mono text-[10px] font-black text-primary">{stock.ticker}</p>
              <p className="font-mono text-[10px] text-white/75 uppercase tracking-tight">{stock.name}</p>
              <p className="font-mono text-[9px] text-white/45 uppercase">
                {archetypeLabel(stock.archetype)}
              </p>
              <p className="font-mono text-[10px] text-white/75">{formatNumber(stock.current_price)}</p>
              <p
                className={`font-mono text-[10px] font-black ${
                  stock.change >= 0 ? "text-green-400" : "text-red-400"
                }`}
              >
                {stock.change >= 0 ? "+" : ""}
                {formatNumber(stock.change)}
              </p>
              <p className="font-mono text-[10px] text-white/50">{formatNumber(stock.target_price)}</p>
              <p className={`font-mono text-[9px] uppercase ${regimeTone(stock.current_regime)}`}>
                {stock.current_regime}
              </p>
              <p className="font-mono text-[10px] text-white/60">{formatNumber(stock.marketCap, 0)}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Volume chart */}
      <div className="relative bg-[#0d0d0d] border border-white/6 p-7">
        <CornerMarks />
        <div className="mb-7 space-y-1">
          <span className="font-mono text-[8px] text-white/45 tracking-[0.35em] uppercase">
            [EQT.001.D] · TURNOVER
          </span>
          <h3 className="font-mono text-xl font-black tracking-tighter uppercase text-white">
            Market Volume
          </h3>
          <p className="font-mono text-[9px] text-white/40 tracking-[0.15em] uppercase">
            Aggregate equity trading activity
          </p>
        </div>

        <div className="h-[240px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={marketIndexHistory}>
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
              <Line
                type="monotone"
                dataKey="totalVolume"
                stroke="#22c55e"
                strokeWidth={2}
                dot={false}
                name="Volume CC"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}