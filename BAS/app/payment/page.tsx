"use client";

import { useState } from "react";
import { ArrowLeft, Zap, AlertTriangle, Send, Clock } from "lucide-react";
import Link from "next/link";
import {
  PAYMENT_FEE_PCT,
  LOAN_FEE_PCT,
  CC_PAYMENT_PRESETS,
  SCU_S_LOAN_PRESETS,
  DUR_LOAN_PRESETS,
  COMMITTED_SCU,
  type CommittedSlot,
} from "@/lib/mock-data";
import { useStore } from "@/lib/store";

type Mode = "PAYMENT" | "LOAN";

interface AvailabilitySlot extends CommittedSlot {
  cumulativeAfter: number;
  covers:          boolean;
}

function computeAvailability(needed: number, currentBalance: number): AvailabilitySlot[] {
  const sorted = [...COMMITTED_SCU].sort((a, b) => a.returnsInMin - b.returnsInMin);
  let cumulative = currentBalance;
  let covered = false;
  return sorted.map((slot) => {
    cumulative += slot.scuReturning;
    const covers = !covered && cumulative >= needed;
    if (covers) covered = true;
    return { ...slot, cumulativeAfter: cumulative, covers };
  });
}

// ─── Helpers ───────────────────────────────────────────────────────────────

function formatDuration(s: number): string {
  if (s <= 0) return "—";
  if (s < 60)    return `${s}s`;
  if (s < 3600)  return `${Math.floor(s / 60)}m ${s % 60 > 0 ? `${s % 60}s` : ""}`.trim();
  if (s < 86400) return `${Math.floor(s / 3600)}h ${Math.floor((s % 3600) / 60) > 0 ? `${Math.floor((s % 3600) / 60)}m` : ""}`.trim();
  return `${Math.floor(s / 86400)}d ${Math.floor((s % 86400) / 3600) > 0 ? `${Math.floor((s % 86400) / 3600)}h` : ""}`.trim();
}

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

function FieldLabel({ code, label }: { code: string; label: string }) {
  return (
    <div className="flex items-center gap-2 mb-3">
      <div className="w-1.5 h-1.5 bg-primary/50" />
      <span className="font-mono text-[8px] text-white/50 tracking-[0.3em] uppercase">{code} // {label}</span>
    </div>
  );
}

// ─── Page ──────────────────────────────────────────────────────────────────

export default function PaymentPage() {
  const { ccBalance, scuBalance, executePayment, executeLoan } = useStore();
  const [mode, setMode]           = useState<Mode>("PAYMENT");
  const [recipient, setRecipient] = useState("");
  const [note, setNote]           = useState("");
  const [confirmed, setConfirmed] = useState(false);

  // payment state
  const [ccAmount, setCcAmount]   = useState("");

  // loan state
  const [scuPerSec, setScuPerSec] = useState("");
  const [duration, setDuration]   = useState("");

  // ── derived values ───────────────────────────────────────
  const parsedCC  = parseFloat(ccAmount)  || 0;
  const parsedSPS = parseFloat(scuPerSec) || 0;
  const parsedDur = parseInt(duration)    || 0;

  const totalSCU  = parsedSPS * parsedDur;
  const loanFee   = totalSCU * LOAN_FEE_PCT;
  const loanTotal = totalSCU + loanFee;

  const payFee    = parsedCC * PAYMENT_FEE_PCT;
  const payTotal  = parsedCC + payFee;

  const payExcess    = payTotal > ccBalance;
  const loanExcess   = loanTotal > scuBalance;
  const availability = loanExcess ? computeAvailability(loanTotal, scuBalance) : [];

  const payValid  = parsedCC > 0 && recipient.trim().length > 0 && !payExcess;
  const loanValid = parsedSPS > 0 && parsedDur > 0 && recipient.trim().length > 0 && !loanExcess;
  const isValid   = mode === "PAYMENT" ? payValid : loanValid;

  function reset() {
    setConfirmed(false);
    setCcAmount("");
    setScuPerSec("");
    setDuration("");
    setRecipient("");
    setNote("");
  }

  function handleMode(m: Mode) {
    setMode(m);
    setConfirmed(false);
    setCcAmount("");
    setScuPerSec("");
    setDuration("");
  }

  return (
    <div className="flex flex-col gap-5 p-8 max-w-4xl mx-auto w-full">

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
            [PAY.000] · {mode === "PAYMENT" ? "CC PAYMENT" : "SCU LOAN"} · OUTBOUND
          </span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-1.5 bg-primary animate-pulse" />
          <span className="font-mono text-[9px] text-primary/60 tracking-[0.25em]">SECURE.CHANNEL</span>
        </div>
      </div>

      {/* Page title + mode toggle */}
      <div className="relative bg-[#0d0d0d] border border-white/[0.06] px-7 py-6 flex items-center justify-between">
        <CornerMarks />
        <div>
          <p className="font-mono text-[8px] text-white/45 tracking-[0.35em] uppercase mb-1">
            {mode === "PAYMENT" ? "Send Compute Credits to a peer" : "Loan Compute Units to a peer"}
          </p>
          <h1 className="font-mono text-4xl font-black tracking-tighter uppercase text-white">
            {mode === "PAYMENT" ? "PAYMENT" : "SCU LOAN"}
          </h1>
        </div>
        {/* Mode toggle */}
        <div className="flex items-center gap-0 border border-white/[0.08]">
          {(["PAYMENT", "LOAN"] as Mode[]).map((m) => (
            <button
              key={m}
              onClick={() => handleMode(m)}
              className={`flex items-center gap-2 px-5 py-2.5 font-mono text-[9px] uppercase tracking-[0.25em] transition-all border-r border-white/[0.08] last:border-r-0 ${
                mode === m
                  ? "bg-primary/10 text-primary"
                  : "text-white/40 hover:text-white/60 hover:bg-white/[0.02]"
              }`}
            >
              {m === "PAYMENT" ? <Send className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
              {m}
            </button>
          ))}
        </div>
      </div>

      {/* Recipient */}
      <div className="relative bg-[#0d0d0d] border border-white/[0.06] p-6">
        <CornerMarks />
        <FieldLabel code="PAY.001" label="RECIPIENT" />
        <div className="relative border border-white/[0.08] bg-white/[0.02] focus-within:border-primary/40 transition-colors">
          <input
            type="text"
            value={recipient}
            onChange={(e) => { setRecipient(e.target.value); setConfirmed(false); }}
            placeholder="USER_ID or node address"
            className="w-full bg-transparent px-4 py-3.5 font-mono text-sm text-white placeholder-white/20 outline-none tracking-wider uppercase"
          />
        </div>
        {recipient.trim() && (
          <div className="flex items-center gap-2 mt-2">
            <div className="w-1 h-1 bg-[#22c55e]" />
            <span className="font-mono text-[8px] text-[#22c55e]/70 tracking-[0.2em] uppercase">Peer resolved</span>
          </div>
        )}
      </div>

      {/* ── PAYMENT MODE ── */}
      {mode === "PAYMENT" && (
        <div className="relative bg-[#0d0d0d] border border-white/[0.06] p-6">
          <CornerMarks />
          <FieldLabel code="PAY.002" label="AMOUNT" />

          <div className="flex items-center justify-between mb-4">
            <span className="font-mono text-[8px] text-white/40 tracking-[0.2em] uppercase">Available</span>
            <span className="font-mono text-[9px] font-black text-primary">{ccBalance.toLocaleString()} CC</span>
          </div>

          <div className={`relative border transition-colors ${
            payExcess ? "border-red-500/50 bg-red-500/5" : "border-white/[0.08] bg-white/[0.02]"
          }`}>
            <input
              type="text"
              inputMode="decimal"
              value={ccAmount}
              onChange={(e) => { setCcAmount(e.target.value.replace(/[^0-9.]/g, "")); setConfirmed(false); }}
              placeholder="0"
              className="w-full bg-transparent px-4 py-4 font-mono text-3xl font-black tracking-tighter text-white placeholder-white/15 outline-none"
            />
            <div className="absolute right-4 top-1/2 -translate-y-1/2">
              <span className="font-mono text-sm font-black text-white/30 tracking-[0.15em]">CC</span>
            </div>
          </div>

          {payExcess && (
            <div className="flex items-center gap-2 mt-2">
              <AlertTriangle className="w-3 h-3 text-red-400" />
              <span className="font-mono text-[8px] text-red-400 tracking-[0.2em] uppercase">Insufficient balance (incl. fee)</span>
            </div>
          )}

          <div className="grid grid-cols-4 gap-2 mt-4">
            {CC_PAYMENT_PRESETS.map((p) => (
              <button
                key={p}
                onClick={() => { setCcAmount(String(p)); setConfirmed(false); }}
                className={`border font-mono text-[9px] font-black tracking-[0.15em] py-2 transition-all uppercase ${
                  parsedCC === p
                    ? "border-primary/50 bg-primary/10 text-primary"
                    : "border-white/[0.08] text-white/40 hover:border-primary/50 hover:text-white/60"
                }`}
              >
                {p.toLocaleString()} CC
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── LOAN MODE ── */}
      {mode === "LOAN" && (
        <div className="flex flex-col gap-4">

          {/* SCU/sec + Duration side by side */}
          <div className="grid grid-cols-2 gap-4">

            {/* SCU per second */}
            <div className="relative bg-[#0d0d0d] border border-white/[0.06] p-6">
              <CornerMarks />
              <FieldLabel code="PAY.002" label="SCU / SECOND" />
              <div className="flex items-center justify-between mb-4">
                <span className="font-mono text-[8px] text-white/40 tracking-[0.2em] uppercase">Rate</span>
                <span className="font-mono text-[9px] font-black text-primary">
                  {parsedSPS > 0 ? `${parsedSPS.toLocaleString()} SCU/s` : "—"}
                </span>
              </div>
              <div className="relative border border-white/[0.08] bg-white/[0.02] focus-within:border-primary/40 transition-colors">
                <input
                  type="text"
                  inputMode="decimal"
                  value={scuPerSec}
                  onChange={(e) => { setScuPerSec(e.target.value.replace(/[^0-9.]/g, "")); setConfirmed(false); }}
                  placeholder="0"
                  className="w-full bg-transparent px-4 py-4 font-mono text-3xl font-black tracking-tighter text-white placeholder-white/15 outline-none"
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  <span className="font-mono text-[9px] font-black text-white/30 tracking-[0.1em]">SCU/s</span>
                </div>
              </div>
              <div className="grid grid-cols-4 gap-1.5 mt-3">
                {SCU_S_LOAN_PRESETS.map((p) => (
                  <button
                    key={p}
                    onClick={() => { setScuPerSec(String(p)); setConfirmed(false); }}
                    className={`border font-mono text-[8px] font-black py-1.5 transition-all ${
                      parsedSPS === p
                        ? "border-primary/50 bg-primary/10 text-primary"
                        : "border-white/[0.08] text-white/40 hover:border-primary/50 hover:text-white/60"
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>

            {/* Duration */}
            <div className="relative bg-[#0d0d0d] border border-white/[0.06] p-6">
              <CornerMarks accent="green" />
              <FieldLabel code="PAY.003" label="DURATION" />
              <div className="flex items-center justify-between mb-4">
                <span className="font-mono text-[8px] text-white/40 tracking-[0.2em] uppercase">Length</span>
                <span className="font-mono text-[9px] font-black text-[#22c55e]">
                  {parsedDur > 0 ? formatDuration(parsedDur) : "—"}
                </span>
              </div>
              <div className="relative border border-white/[0.08] bg-white/[0.02] focus-within:border-[#22c55e]/40 transition-colors">
                <input
                  type="text"
                  inputMode="numeric"
                  value={duration}
                  onChange={(e) => { setDuration(e.target.value.replace(/[^0-9]/g, "")); setConfirmed(false); }}
                  placeholder="0"
                  className="w-full bg-transparent px-4 py-4 font-mono text-3xl font-black tracking-tighter text-white placeholder-white/15 outline-none"
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  <span className="font-mono text-[9px] font-black text-white/30 tracking-[0.1em]">SEC</span>
                </div>
              </div>
              <div className="grid grid-cols-4 gap-1.5 mt-3">
                {DUR_LOAN_PRESETS.map((p) => (
                  <button
                    key={p}
                    onClick={() => { setDuration(String(p)); setConfirmed(false); }}
                    className={`border font-mono text-[8px] font-black py-1.5 transition-all ${
                      parsedDur === p
                        ? "border-[#22c55e]/50 bg-[#22c55e]/10 text-[#22c55e]"
                        : "border-white/[0.08] text-white/40 hover:border-primary/50 hover:text-white/60"
                    }`}
                  >
                    {formatDuration(p)}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Total SCU display */}
          <div className="relative bg-[#0d0d0d] border border-white/[0.06] px-6 py-5">
            <CornerMarks accent="green" />
            <div className="flex items-center justify-between">
              <div>
                <p className="font-mono text-[8px] text-white/45 tracking-[0.35em] uppercase mb-1">Total SCU to Loan</p>
                <div className="flex items-baseline gap-2">
                  <span className={`font-mono text-4xl font-black tracking-tighter ${totalSCU > 0 ? "text-[#22c55e]" : "text-white/20"}`}>
                    {totalSCU > 0 ? totalSCU.toLocaleString() : "0"}
                  </span>
                  <span className="font-mono text-sm text-white/35 uppercase tracking-[0.15em]">SCU</span>
                </div>
              </div>
              <div className="text-right space-y-1">
                <div>
                  <p className="font-mono text-[8px] text-white/40 tracking-[0.2em] uppercase">Available</p>
                  <p className="font-mono text-sm font-black text-[#22c55e]">{scuBalance.toLocaleString()} SCU</p>
                </div>
                {parsedSPS > 0 && parsedDur > 0 && (
                  <p className="font-mono text-[8px] text-white/40 tracking-[0.15em] uppercase">
                    {parsedSPS.toLocaleString()} SCU/s × {formatDuration(parsedDur)}
                  </p>
                )}
              </div>
            </div>
            {loanExcess && (
              <div className="mt-4 space-y-3">
                {/* shortage summary */}
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-3 h-3 text-red-400 shrink-0" />
                  <span className="font-mono text-[8px] text-red-400 tracking-[0.2em] uppercase">
                    Insufficient · Need {(loanTotal - scuBalance).toLocaleString(undefined, { maximumFractionDigits: 0 })} more SCU
                  </span>
                </div>

                {/* availability timeline */}
                <div className="border border-white/[0.06] bg-white/[0.01]">
                  <div className="px-3 py-2 border-b border-white/[0.05]">
                    <span className="font-mono text-[8px] text-white/40 tracking-[0.3em] uppercase">// Next available slots</span>
                  </div>
                  <div className="divide-y divide-white/[0.04]">
                    {availability.map((slot) => (
                      <div
                        key={slot.label}
                        className={`flex items-center justify-between px-3 py-2.5 transition-colors ${
                          slot.covers ? "bg-[#22c55e]/[0.04]" : ""
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-1 h-1 shrink-0 ${slot.covers ? "bg-[#22c55e]" : "bg-white/20"}`} />
                          <div>
                            <p className={`font-mono text-[9px] font-black uppercase tracking-tight ${slot.covers ? "text-[#22c55e]" : "text-white/50"}`}>
                              {slot.label}
                            </p>
                            <p className="font-mono text-[8px] text-white/30 tracking-[0.15em] uppercase">{slot.origin}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className={`font-mono text-[9px] font-black ${slot.covers ? "text-[#22c55e]" : "text-white/50"}`}>
                            +{slot.scuReturning.toLocaleString()} SCU
                          </p>
                          <p className="font-mono text-[8px] text-white/35 tracking-widest">
                            in {slot.returnsInMin}m
                            {slot.covers && <span className="text-[#22c55e] ml-1.5">← available here</span>}
                          </p>
                        </div>
                      </div>
                    ))}
                    {/* show if even all returning SCU isn't enough */}
                    {!availability.some((s) => s.covers) && (
                      <div className="px-3 py-2.5 flex items-center gap-2">
                        <AlertTriangle className="w-3 h-3 text-red-400/60" />
                        <span className="font-mono text-[8px] text-red-400/60 tracking-[0.2em] uppercase">
                          Insufficient even after all SCU returns · Reduce loan size
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Note */}
      <div className="relative bg-[#0d0d0d] border border-white/[0.06] p-6">
        <CornerMarks accent="muted" />
        <FieldLabel code="PAY.004" label="NOTE (OPTIONAL)" />
        <div className="relative border border-white/[0.08] bg-white/[0.02] focus-within:border-primary/50 transition-colors">
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Add a message for the recipient..."
            rows={2}
            className="w-full bg-transparent px-4 py-3 font-mono text-[11px] text-white/70 placeholder-white/20 outline-none tracking-wider resize-none"
          />
        </div>
      </div>

      {/* Transaction details */}
      <div className="relative bg-[#0d0d0d] border border-white/[0.06] px-6 py-5">
        <CornerMarks />
        <div className="flex items-center gap-2 mb-4">
          <Zap className="w-3 h-3 text-primary/50" />
          <span className="font-mono text-[8px] text-white/45 tracking-[0.35em] uppercase">[PAY.005] // TRANSACTION DETAILS</span>
        </div>

        {mode === "PAYMENT" ? (
          <div className="space-y-2.5">
            {[
              { label: "Recipient",           value: recipient.trim() || "—",                                                                               accent: false },
              { label: "Send Amount",         value: parsedCC > 0 ? `${parsedCC.toLocaleString()} CC` : "—",                                               accent: false },
              { label: "Network Fee (0.3%)",  value: parsedCC > 0 ? `${payFee.toFixed(2)} CC` : "—",                                                       accent: false },
              { label: "Total Deducted",      value: parsedCC > 0 ? `${payTotal.toLocaleString(undefined, { maximumFractionDigits: 2 })} CC` : "—",        accent: true  },
            ].map(({ label, value, accent }) => (
              <div key={label} className="flex items-center justify-between">
                <span className="font-mono text-[9px] text-white/45 tracking-[0.2em] uppercase">{label}</span>
                <span className={`font-mono text-[10px] font-black tracking-wider ${accent ? "text-primary" : "text-white/70"}`}>{value}</span>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-2.5">
            {[
              { label: "Recipient",       value: recipient.trim() || "—",                                                                                   accent: false },
              { label: "Rate",            value: parsedSPS > 0 ? `${parsedSPS.toLocaleString()} SCU/s` : "—",                                              accent: false },
              { label: "Duration",        value: parsedDur > 0 ? formatDuration(parsedDur) : "—",                                                           accent: false },
              { label: "Total SCU",       value: totalSCU > 0 ? `${totalSCU.toLocaleString()} SCU` : "—",                                                  accent: false },
              { label: "Loan Fee (1.0%)", value: totalSCU > 0 ? `${loanFee.toLocaleString(undefined, { maximumFractionDigits: 2 })} SCU` : "—",           accent: false },
              { label: "Total Deducted",  value: totalSCU > 0 ? `${loanTotal.toLocaleString(undefined, { maximumFractionDigits: 2 })} SCU` : "—",          accent: true  },
            ].map(({ label, value, accent }) => (
              <div key={label} className="flex items-center justify-between">
                <span className="font-mono text-[9px] text-white/45 tracking-[0.2em] uppercase">{label}</span>
                <span className={`font-mono text-[10px] font-black tracking-wider ${accent ? "text-[#22c55e]" : "text-white/70"}`}>{value}</span>
              </div>
            ))}
          </div>
        )}

        <div className="h-px bg-white/[0.04] my-4" />
        <div className="flex items-center gap-2">
          <div className="w-1 h-1 bg-primary/50" />
          <span className="font-mono text-[8px] text-white/35 tracking-[0.2em] uppercase">
            {mode === "PAYMENT"
              ? "Payments are final and non-reversible once confirmed"
              : "Loans are streamed in real-time · Recipient receives SCU/s continuously"}
          </span>
        </div>
      </div>

      {/* Confirm / Execute */}
      <div className="flex gap-3">
        {confirmed && (
          <button
            onClick={reset}
            className="border border-white/[0.08] bg-white/[0.02] px-6 py-4 font-mono text-[9px] font-black tracking-[0.25em] uppercase text-white/40 hover:text-white/60 hover:border-primary/50 transition-all"
          >
            RESET
          </button>
        )}
        <button
          onClick={() => {
          if (!isValid) return;
          if (mode === "PAYMENT") executePayment(parsedCC, recipient, note);
          else executeLoan(parsedSPS, parsedDur, recipient, note);
          setConfirmed(true);
        }}
          disabled={!isValid}
          className={`relative flex-1 py-4 font-mono text-sm font-black tracking-[0.3em] uppercase transition-all duration-200 ${
            confirmed
              ? "border border-[#22c55e]/50 bg-[#22c55e]/10 text-[#22c55e]"
              : isValid
              ? "border border-primary/50 bg-primary/10 text-primary hover:bg-primary/15 hover:border-primary/70"
              : "border border-white/[0.06] bg-white/[0.02] text-white/20 cursor-not-allowed"
          }`}
        >
          {isValid && !confirmed && (
            <>
              <span className="absolute top-0 left-0 w-2 h-2 border-t border-l border-primary/60" />
              <span className="absolute top-0 right-0 w-2 h-2 border-t border-r border-primary/60" />
              <span className="absolute bottom-0 left-0 w-2 h-2 border-b border-l border-primary/60" />
              <span className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-primary/60" />
            </>
          )}
          {confirmed
            ? mode === "PAYMENT"
              ? `✓ PAYMENT SENT · ${parsedCC.toLocaleString()} CC → ${recipient.trim()}`
              : `✓ LOAN ACTIVE · ${parsedSPS} SCU/s for ${formatDuration(parsedDur)}`
            : !isValid && !recipient.trim()
            ? "ENTER RECIPIENT"
            : !isValid && mode === "PAYMENT" && parsedCC === 0
            ? "ENTER AMOUNT"
            : !isValid && mode === "LOAN" && (parsedSPS === 0 || parsedDur === 0)
            ? "ENTER RATE & DURATION"
            : mode === "PAYMENT"
            ? `SEND ${parsedCC.toLocaleString()} CC → ${recipient.trim()}`
            : `START LOAN · ${parsedSPS} SCU/s · ${formatDuration(parsedDur)}`
          }
        </button>
      </div>

    </div>
  );
}
