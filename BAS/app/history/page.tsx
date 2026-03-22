"use client";

// ============================================================
// TransactionHistory.tsx
// Simplified version — transactions are either OUT (spending)
// or IN (receiving), and all settled transactions are COMPLETE.
// ============================================================

import { useState } from "react";
import { ArrowLeft, ArrowDownLeft, ArrowUpRight } from "lucide-react";
import Link from "next/link";


// ============================================================
// SECTION 1 — TYPE DEFINITIONS
// Simplified from the original: TxType now IS the direction
// (OUT / IN), and TxStatus only has one value: COMPLETE.
// ============================================================

// OUT = spending credits, IN = receiving credits
type TxType = "OUT" | "IN";

// Only one status for now — every settled transaction is COMPLETE
type TxStatus = "COMPLETE";

interface Transaction {
  id: string;           // Unique ID, e.g. "TXN-2941"
  desc: string;         // Short description shown in the table
  type: TxType;         // "OUT" = spending, "IN" = receiving
  amount: number;       // How many credits (CRD)
  counterparty: string; // Who you traded with — was "party" before, fixed to match interface
  status: TxStatus;     // Always "COMPLETE" for now
  date: string;         // Date string, e.g. "2026-03-21"
  time: string;         // Time string, e.g. "14:32:08"
  note: string;         // Extra detail shown in the expandable drawer
  category: string;     // e.g. "FOOD", "MEDIA", "SERVICES"
}


// ============================================================
// SECTION 2 — TRANSACTION DATA
// Add your own transactions here following the same shape.
// Make sure every field matches the interface above.
// ============================================================

const transactions: Transaction[] = [
  {
    id: "TXN-0001",
    desc: "BANANA · PRODUCE MARKET",
    type: "OUT",
    amount: 1000,
    counterparty: "EVIL INC",  // was "party" — fixed to "counterparty"
    status: "COMPLETE",
    date: "3000-04-23",
    time: "15:10:00",
    note: "blud",
    category: "FOOD",
  },
  {
    id: "TXN-0002",
    desc: "CREDIT TOPUP · EXCHANGE DESK",
    type: "IN",
    amount: 2500,
    counterparty: "EXCHANGE · NODE-7",
    status: "COMPLETE",
    date: "3000-04-22",
    time: "09:00:00",
    note: "Monthly credit allocation",
    category: "ACCOUNT",
  },
  {
    id: "TXN-0003",
    desc: "COFFEE VOUCHER · VENDOR 44",
    type: "OUT",
    amount: 8,
    counterparty: "VENDOR-0044 · BREW NODE",
    status: "COMPLETE",
    date: "3000-04-21",
    time: "08:03:17",
    note: "1x cold brew, 250ml",
    category: "FOOD",
  },
  {
    id: "TXN-0004",
    desc: "BOOK RENTAL · LIBRARY NODE",
    type: "OUT",
    amount: 3,
    counterparty: "LIB-NODE-01 · ARCHIVE",
    status: "COMPLETE",
    date: "3000-04-20",
    time: "16:08:33",
    note: "'Distributed Systems' — 7-day access token",
    category: "MEDIA",
  },
  {
    id: "TXN-0005",
    desc: "PAYMENT RECEIVED · NOVA LABS",
    type: "IN",
    amount: 560,
    counterparty: "USER-0112 · NOVA LABS",
    status: "COMPLETE",
    date: "3000-04-19",
    time: "03:30:00",
    note: "Trade settled — 3x protein bar",
    category: "TRADE",
  },
];


// ============================================================
// SECTION 3 — HELPERS
// ============================================================

// FilterType: what the filter buttons can be set to.
// "ALL" shows everything. "OUT"/"IN" filter by direction.
type FilterType = "ALL" | TxType;

// Maps each TxType to its accent colour.
// OUT = white (neutral spending), IN = green (receiving)
// BUG FIX: original was missing the "IN" entry — Record<TxType>
// requires BOTH keys to be defined or TypeScript will error.
const TYPE_COLOR: Record<TxType, string> = {
  OUT: "#ffffff",  // white
  IN:  "#22c55e",  // green
};

// Maps each TxStatus to a colour for the status dot + label.
// BUG FIX: original had "cont" (typo), "RECORD" (wrong case),
// and "OUT=" (wrong key and wrong syntax).
// Correct: const, Record, and the key must be the TxStatus value.
const STATUS_COLOR: Record<TxStatus, string> = {
  COMPLETE: "#22c55e", // green
};

// ─── CornerMarks ────────────────────────────────────────────
// Decorative L-shaped brackets in each corner of a panel.
function CornerMarks() {
  return (
    <>
      <span className="absolute top-0 left-0 w-3 h-3 border-t border-l border-white/30 pointer-events-none" />
      <span className="absolute top-0 right-0 w-3 h-3 border-t border-r border-white/30 pointer-events-none" />
      <span className="absolute bottom-0 left-0 w-3 h-3 border-b border-l border-white/30 pointer-events-none" />
      <span className="absolute bottom-0 right-0 w-3 h-3 border-b border-r border-white/30 pointer-events-none" />
    </>
  );
}

// ─── DirectionIcon ──────────────────────────────────────────
// Now driven purely by TxType (OUT/IN) since there's no failed state.
// OUT → up-right arrow, IN → down-left arrow.
function DirectionIcon({ type }: { type: TxType }) {
  if (type === "IN") return <ArrowDownLeft className="w-3.5 h-3.5" />;
  return <ArrowUpRight className="w-3.5 h-3.5" />;
}

// ─── generateHash ───────────────────────────────────────────
// Produces a fake-looking transaction hash from the tx ID.
function generateHash(seed: string): string {
  let h = 0;
  for (let i = 0; i < seed.length; i++) {
    h = (h << 5) - h + seed.charCodeAt(i);
    h |= 0;
  }
  return "0x" + Math.abs(h).toString(16).padStart(8, "0") + "f4a2e9";
}


// ============================================================
// SECTION 4 — TxRow COMPONENT
// One clickable table row. Click to expand the detail drawer.
// ============================================================

function TxRow({ tx }: { tx: Transaction }) {
  // Drawer starts closed; clicking the row toggles it
  const [open, setOpen] = useState(false);

  const typeColor   = TYPE_COLOR[tx.type];
  const statusColor = STATUS_COLOR[tx.status];

  // Amount colour: green for IN, white for OUT
  const amtColor = tx.type === "IN" ? "#22c55e" : "#ffffff";
  const dirSign  = tx.type === "IN" ? "+" : "−";

  return (
    <>
      {/* ── Main row ── */}
      <tr
        onClick={() => setOpen((o) => !o)}
        className="border-b border-white/[0.03] hover:bg-white/[0.03] transition-colors cursor-pointer"
      >
        {/* Icon + ID + description */}
        <td className="px-3 py-3.5">
          <div className="flex items-center gap-3">
            <div
              className="flex h-8 w-8 items-center justify-center border shrink-0"
              style={{
                borderColor: `${typeColor}30`,
                backgroundColor: `${typeColor}0d`,
                color: typeColor,
              }}
            >
              <DirectionIcon type={tx.type} />
            </div>
            <div>
              <p className="font-mono text-[8px] text-white/45 tracking-[0.25em] uppercase">{tx.id}</p>
              <p className="font-mono text-[10px] font-black text-white/88 uppercase tracking-tight mt-0.5">{tx.desc}</p>
            </div>
          </div>
        </td>

        {/* OUT / IN badge */}
        <td className="px-3 py-3.5">
          <div
            className="inline-block border px-2 py-0.5"
            style={{ borderColor: `${typeColor}40`, backgroundColor: `${typeColor}0d` }}
          >
            <span className="font-mono text-[8px] font-black tracking-[0.2em]" style={{ color: typeColor }}>
              {tx.type}
            </span>
          </div>
        </td>

        {/* Counterparty */}
        <td className="px-3 py-3.5">
          <p className="font-mono text-[9px] text-white/50 tracking-[0.1em] max-w-[160px] truncate uppercase">
            {tx.counterparty}
          </p>
        </td>

        {/* Date + time */}
        <td className="px-3 py-3.5">
          <p className="font-mono text-[9px] text-white/45 tracking-[0.1em]">{tx.date}</p>
          <p className="font-mono text-[8px] text-white/25 tracking-[0.1em] mt-0.5">{tx.time}</p>
        </td>

        {/* Status — always COMPLETE, shown as a green dot */}
        <td className="px-3 py-3.5">
          <div className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5" style={{ backgroundColor: statusColor }} />
            <span className="font-mono text-[8px] uppercase tracking-[0.2em]" style={{ color: statusColor }}>
              {tx.status}
            </span>
          </div>
        </td>

        {/* Amount */}
        <td className="px-3 py-3.5 text-right">
          <p className="font-mono text-sm font-black tracking-tight" style={{ color: amtColor }}>
            {dirSign}{tx.amount.toLocaleString()}
          </p>
          <p className="font-mono text-[8px] text-white/45 tracking-[0.15em] uppercase mt-0.5">CRD</p>
        </td>
      </tr>

      {/* ── Detail drawer — visible only when row is clicked ── */}
      {open && (
        <tr className="border-b border-white/[0.06]">
          <td colSpan={6} className="px-0 py-0">
            <div className="bg-white/[0.02] border-t border-white/[0.06] px-5 py-4 flex flex-wrap gap-8">
              <div>
                <p className="font-mono text-[8px] text-white/40 tracking-[0.25em] uppercase mb-1.5">NOTE</p>
                <p className="font-mono text-[9px] text-white/65 max-w-xs">{tx.note}</p>
              </div>
              <div>
                <p className="font-mono text-[8px] text-white/40 tracking-[0.25em] uppercase mb-1.5">CATEGORY</p>
                <p className="font-mono text-[9px] text-white/65">{tx.category}</p>
              </div>
              <div>
                <p className="font-mono text-[8px] text-white/40 tracking-[0.25em] uppercase mb-1.5">TX HASH</p>
                <p className="font-mono text-[9px] text-white/30">{generateHash(tx.id)}</p>
              </div>
              <div>
                <p className="font-mono text-[8px] text-white/40 tracking-[0.25em] uppercase mb-1.5">AMOUNT</p>
                <p className="font-mono text-[9px] text-white/65">{tx.amount.toLocaleString()} CRD</p>
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}


// ============================================================
// SECTION 5 — PAGE COMPONENT
// ============================================================

export default function TransactionHistoryPage() {
  // Active filter: ALL, OUT, or IN
  const [filter, setFilter] = useState<FilterType>("ALL");

  const FILTERS: FilterType[] = ["ALL", "OUT", "IN"];

  // Filter the transaction list based on active filter
  const filtered = transactions.filter((tx) => {
    if (filter === "ALL") return true;
    return tx.type === filter;
  });

  // Summary totals — only counting COMPLETE transactions (all of them here)
  const totalOut = transactions
    .filter((t) => t.type === "OUT")
    .reduce((a, b) => a + b.amount, 0);

  const totalIn = transactions
    .filter((t) => t.type === "IN")
    .reduce((a, b) => a + b.amount, 0);

  const balance = totalIn - totalOut;

  return (
    <div className="flex flex-col gap-4 p-8 max-w-7xl mx-auto w-full">

      {/* ── Status bar ── */}
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
          <span className="font-mono text-[9px] text-white/45 tracking-[0.3em] uppercase">
            [TXN.000] · TRANSACTION LEDGER · PAYMENT HISTORY
          </span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-1.5 bg-primary animate-pulse" />
          <span className="font-mono text-[9px] text-primary/60 tracking-[0.25em]">LIVE.SYNC</span>
        </div>
      </div>

      {/* ── Page header + summary ── */}
      <div className="relative bg-[#0d0d0d] border border-white/[0.06] px-7 py-5 flex items-end justify-between flex-wrap gap-4">
        <CornerMarks />
        <div>
          <p className="font-mono text-[8px] text-white/45 tracking-[0.35em] uppercase mb-1">
            Credit Exchange // Payment Records
          </p>
          <h1 className="font-mono text-3xl font-black tracking-tighter uppercase text-white">
            TRANSACTION HISTORY
          </h1>
        </div>

        {/* Summary stats */}
        <div className="flex items-end gap-10 flex-wrap">
          {[
            { label: "Credits Out", value: totalOut,  color: "#ffffff" },
            { label: "Credits In",  value: totalIn,   color: "#22c55e" },
            { label: "Net Balance", value: balance,   color: balance >= 0 ? "#22c55e" : "#ef4444" },
          ].map(({ label, value, color }) => (
            <div key={label} className="text-right">
              <p className="font-mono text-[8px] text-white/45 tracking-[0.3em] uppercase mb-1">{label}</p>
              <p className="font-mono text-2xl font-black tracking-tighter" style={{ color }}>
                {value < 0 ? "−" : ""}{Math.abs(value).toLocaleString()}
                <span className="font-mono text-sm text-white/35 ml-2 uppercase">CRD</span>
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Filter bar + table ── */}
      <div className="relative bg-[#0d0d0d] border border-white/[0.06]">
        <CornerMarks />

        {/* Filter buttons — simplified to just ALL / OUT / IN */}
        <div className="flex border-b border-white/[0.06]">
          {FILTERS.map((f) => {
            const count =
              f === "ALL"
                ? transactions.length
                : transactions.filter((t) => t.type === f).length;

            return (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-4 py-2.5 font-mono text-[9px] uppercase tracking-[0.25em] transition-all border-r border-white/[0.06] last:border-r-0 ${
                  filter === f
                    ? "bg-primary/10 text-primary"
                    : "text-white/40 hover:text-white/60 hover:bg-white/[0.02]"
                }`}
              >
                {f}
                {f !== "ALL" && <span className="ml-1.5 opacity-50">[{count}]</span>}
              </button>
            );
          })}
        </div>

        {/* Table */}
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b border-white/[0.06]">
              {["TRANSACTION", "TYPE", "COUNTERPARTY", "DATE", "STATUS", "AMOUNT"].map((h) => (
                <th
                  key={h}
                  className={`px-3 py-2.5 font-mono text-[8px] text-white/30 tracking-[0.3em] uppercase font-normal ${
                    h === "AMOUNT" ? "text-right" : "text-left"
                  }`}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((tx) => (
              <TxRow key={tx.id} tx={tx} />
            ))}
          </tbody>
        </table>

        {filtered.length === 0 && (
          <div className="py-12 text-center">
            <p className="font-mono text-[9px] text-white/25 tracking-[0.3em] uppercase">NO TRANSACTIONS FOUND</p>
          </div>
        )}
      </div>

      {/* ── Legend ── */}
      <div className="relative bg-[#0d0d0d] border border-white/[0.06] px-7 py-4">
        <CornerMarks />
        <div className="flex items-center justify-between flex-wrap gap-4">
          <span className="font-mono text-[8px] text-white/35 tracking-[0.35em] uppercase">
            [TXN.REF] // TYPE LEGEND
          </span>
          <div className="flex items-center gap-6 flex-wrap">
            {(["OUT", "IN"] as TxType[]).map((type) => (
              <div key={type} className="flex items-center gap-2">
                <div className="w-1.5 h-1.5" style={{ backgroundColor: TYPE_COLOR[type] }} />
                <span className="font-mono text-[8px] text-white/60 uppercase tracking-[0.2em]">
                  {type === "OUT" ? "OUT · spending" : "IN · receiving"}
                </span>
              </div>
            ))}
            <div className="h-3 w-px bg-white/[0.08]" />
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5" style={{ backgroundColor: STATUS_COLOR.COMPLETE }} />
              <span className="font-mono text-[8px] text-white/60 uppercase tracking-[0.2em]">COMPLETE</span>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}

