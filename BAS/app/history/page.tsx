"use client";

import { useState } from "react";
import { ArrowLeft, ArrowDownLeft, ArrowUpRight } from "lucide-react";
import Link from "next/link";
import {
  STATUS_COLOR,
  TX_TYPE_COLOR,
  type Transaction,
  type TxType,
  type TxStatus,
} from "@/lib/mock-data";
import { useStore } from "@/lib/store";

// ─── Helpers ────────────────────────────────────────────────

type FilterType = "ALL" | TxType;

function CornerMarks({ accent = "primary" }: { accent?: "primary" | "green" | "muted" }) {
  const cls = accent === "green" ? "border-[#22c55e]/50" : "border-primary/50";
  return (
    <>
      <span className={`absolute top-0 left-0 w-3 h-3 border-t border-l ${cls} pointer-events-none`} />
      <span className={`absolute top-0 right-0 w-3 h-3 border-t border-r ${cls} pointer-events-none`} />
      <span className={`absolute bottom-0 left-0 w-3 h-3 border-b border-l ${cls} pointer-events-none`} />
      <span className={`absolute bottom-0 right-0 w-3 h-3 border-b border-r ${cls} pointer-events-none`} />
    </>
  );
}

function DirectionIcon({ type }: { type: TxType }) {
  if (type === "IN") return <ArrowDownLeft className="w-3.5 h-3.5" />;
  return <ArrowUpRight className="w-3.5 h-3.5" />;
}

function generateHash(seed: string): string {
  let h = 0;
  for (let i = 0; i < seed.length; i++) {
    h = (h << 5) - h + seed.charCodeAt(i);
    h |= 0;
  }
  return "0x" + Math.abs(h).toString(16).padStart(8, "0") + "f4a2e9";
}

// ─── TxRow ──────────────────────────────────────────────────

function TxRow({ tx }: { tx: Transaction }) {
  const [open, setOpen] = useState(false);

  const typeColor   = TX_TYPE_COLOR[tx.type];
  const statusColor = STATUS_COLOR[tx.status];
  const amtColor    = tx.type === "IN" ? "#22c55e" : "#ef4444";
  const dirSign     = tx.type === "IN" ? "+" : "−";

  return (
    <>
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

        {/* Counterparty */}
        <td className="px-3 py-3.5">
          <p className="font-mono text-[9px] text-white/50 tracking-[0.1em] max-w-[160px] truncate uppercase">
            {tx.counterparty}
          </p>
        </td>

        {/* Date + time */}
        <td className="px-3 py-3.5">
          <p className="font-mono text-[9px] text-white/55 tracking-[0.1em]">{tx.date}</p>
          <p className="font-mono text-[8px] text-white/40 tracking-[0.1em] mt-0.5">{tx.time}</p>
        </td>

        {/* Status */}
        <td className="px-3 py-3.5">
          <div className="flex items-center gap-1.5">
            <div
              className={`w-1.5 h-1.5 ${tx.status === "PENDING" ? "animate-pulse" : ""}`}
              style={{ backgroundColor: statusColor }}
            />
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
          <p className="font-mono text-[8px] text-white/45 tracking-[0.15em] uppercase mt-0.5">CC</p>
        </td>
      </tr>

      {/* Detail drawer */}
      {open && (
        <tr className="border-b border-white/[0.06]">
          <td colSpan={5} className="px-0 py-0">
            <div className="bg-white/[0.02] border-t border-white/[0.06] px-5 py-4 flex flex-wrap gap-8">
              <div>
                <p className="font-mono text-[8px] text-white/55 tracking-[0.25em] uppercase mb-1.5">NOTE</p>
                <p className="font-mono text-[9px] text-white/75 max-w-xs">{tx.note}</p>
              </div>
              <div>
                <p className="font-mono text-[8px] text-white/55 tracking-[0.25em] uppercase mb-1.5">CATEGORY</p>
                <p className="font-mono text-[9px] text-white/75">{tx.category}</p>
              </div>
              <div>
                <p className="font-mono text-[8px] text-white/55 tracking-[0.25em] uppercase mb-1.5">TX HASH</p>
                <p className="font-mono text-[9px] text-white/45">{generateHash(tx.id)}</p>
              </div>
              <div>
                <p className="font-mono text-[8px] text-white/55 tracking-[0.25em] uppercase mb-1.5">AMOUNT</p>
                <p className="font-mono text-[9px] text-white/75">{tx.amount.toLocaleString()} CC</p>
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

// ─── Page ───────────────────────────────────────────────────

export default function TransactionHistoryPage() {
  const { transactions: TRANSACTIONS } = useStore();
  const [filter, setFilter] = useState<FilterType>("ALL");
  const FILTERS: FilterType[] = ["ALL", "OUT", "IN"];

  const filtered = TRANSACTIONS.filter((tx) => filter === "ALL" || tx.type === filter);

  const totalOut = TRANSACTIONS.filter((t) => t.type === "OUT").reduce((a, b) => a + b.amount, 0);
  const totalIn  = TRANSACTIONS.filter((t) => t.type === "IN").reduce((a, b) => a + b.amount, 0);
  const balance  = totalIn - totalOut;

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
          <span className="font-mono text-[9px] text-white/45 tracking-[0.3em] uppercase">
            [TXN.000] · TRANSACTION LEDGER · PAYMENT HISTORY
          </span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-1.5 bg-primary animate-pulse" />
          <span className="font-mono text-[9px] text-primary/60 tracking-[0.25em]">LIVE.SYNC</span>
        </div>
      </div>

      {/* Page header + summary */}
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
            { label: "Credits Out", value: totalOut, color: "#ffffff" },
            { label: "Credits In",  value: totalIn,  color: "#22c55e" },
            { label: "Net Balance", value: balance,  color: balance >= 0 ? "#22c55e" : "#ef4444" },
          ].map(({ label, value, color }) => (
            <div key={label} className="text-right">
              <p className="font-mono text-[8px] text-white/45 tracking-[0.3em] uppercase mb-1">{label}</p>
              <p className="font-mono text-2xl font-black tracking-tighter" style={{ color }}>
                {value < 0 ? "−" : ""}{Math.abs(value).toLocaleString()}
                <span className="font-mono text-sm text-white/35 ml-2 uppercase">CC</span>
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Filter bar + table */}
      <div className="relative bg-[#0d0d0d] border border-white/[0.06]">
        <CornerMarks />

        <div className="flex border-b border-white/[0.06]">
          {FILTERS.map((f) => {
            const count =
              f === "ALL"
                ? TRANSACTIONS.length
                : TRANSACTIONS.filter((t) => t.type === f).length;

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

        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b border-white/[0.06]">
              {["TRANSACTION", "COUNTERPARTY", "DATE", "STATUS", "AMOUNT"].map((h) => (
                <th
                  key={h}
                  className={`px-3 py-2.5 font-mono text-[8px] text-white/45 tracking-[0.3em] uppercase font-normal ${
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

      {/* Legend */}
      <div className="relative bg-[#0d0d0d] border border-white/[0.06] px-7 py-4">
        <CornerMarks />
        <div className="flex items-center justify-between flex-wrap gap-4">
          <span className="font-mono text-[8px] text-white/45 tracking-[0.35em] uppercase">
            [TXN.REF] // TYPE LEGEND
          </span>
          <div className="flex items-center gap-6 flex-wrap">
            {(["OUT", "IN"] as TxType[]).map((type) => (
              <div key={type} className="flex items-center gap-2">
                <div className="w-1.5 h-1.5" style={{ backgroundColor: TX_TYPE_COLOR[type] }} />
                <span className="font-mono text-[8px] text-white/60 uppercase tracking-[0.2em]">
                  {type === "OUT" ? "OUT · spending" : "IN · receiving"}
                </span>
              </div>
            ))}
            <div className="h-3 w-px bg-white/[0.08]" />
            {(["COMPLETE", "PENDING", "REJECTED"] as TxStatus[]).map((s) => (
              <div key={s} className="flex items-center gap-2">
                <div className={`w-1.5 h-1.5 ${s === "PENDING" ? "animate-pulse" : ""}`} style={{ backgroundColor: STATUS_COLOR[s] }} />
                <span className="font-mono text-[8px] text-white/60 uppercase tracking-[0.2em]">{s}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

    </div>
  );
}
