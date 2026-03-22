"use client";

import { useState } from "react";
import { ArrowLeft, ArrowUpDown, Zap, AlertTriangle } from "lucide-react";
import Link from "next/link";
import {
  EXCHANGE_RATE,
  SWAP_FEE_PCT,
  CC_SWAP_PRESETS,
  SCU_SWAP_PRESETS,
} from "@/lib/mock-data";
import { useStore } from "@/lib/store";

type Direction = "CC_TO_SCU" | "SCU_TO_CC";

// ─── Helpers ───────────────────────────────────────────────────────────────

function CornerMarks({ color = "primary" }: { color?: "primary" | "green" }) {
  const cls = color === "green" ? "border-[#22c55e]/50" : "border-primary/50";
  return (
    <>
      <span className={`absolute top-0 left-0 w-3 h-3 border-t border-l ${cls} pointer-events-none`} />
      <span className={`absolute top-0 right-0 w-3 h-3 border-t border-r ${cls} pointer-events-none`} />
      <span className={`absolute bottom-0 left-0 w-3 h-3 border-b border-l ${cls} pointer-events-none`} />
      <span className={`absolute bottom-0 right-0 w-3 h-3 border-b border-r ${cls} pointer-events-none`} />
    </>
  );
}

// ─── Page ──────────────────────────────────────────────────────────────────

export default function SwapPage() {
  const { ccBalance, scuBalance, executeSwap } = useStore();
  const [direction, setDirection] = useState<Direction>("CC_TO_SCU");
  const [amount, setAmount]       = useState<string>("");
  const [confirmed, setConfirmed] = useState(false);
  const [flipping, setFlipping]   = useState(false);

  const isCCtoSCU  = direction === "CC_TO_SCU";
  const fromLabel  = isCCtoSCU ? "CC"  : "SCU";
  const toLabel    = isCCtoSCU ? "SCU" : "CC";
  const fromBal    = isCCtoSCU ? ccBalance : scuBalance;
  const fromColor  = isCCtoSCU ? "primary"   : "green" as const;
  const toColor    = isCCtoSCU ? "green"     : "primary" as const;
  const presets    = isCCtoSCU ? CC_SWAP_PRESETS : SCU_SWAP_PRESETS;
  const rateLabel  = isCCtoSCU
    ? `1 CC = ${EXCHANGE_RATE} SCU`
    : `1 SCU = ${(1 / EXCHANGE_RATE).toFixed(4)} CC`;

  const parsed  = parseFloat(amount) || 0;
  const fee     = parsed * SWAP_FEE_PCT;
  const net     = parsed - fee;
  const output  = isCCtoSCU ? net * EXCHANGE_RATE : net / EXCHANGE_RATE;

  const isExcess = parsed > fromBal;
  const isValid  = parsed > 0 && !isExcess;

  const fromAccent = isCCtoSCU ? "text-primary" : "text-[#22c55e]";
  const toAccent   = isCCtoSCU ? "text-[#22c55e]" : "text-primary";
  const fromBorder = isCCtoSCU ? "border-primary/30 bg-primary/8"          : "border-[#22c55e]/30 bg-[#22c55e]/8";
  const toBorder   = isCCtoSCU ? "border-[#22c55e]/15 bg-[#22c55e]/[0.03]" : "border-primary/15 bg-primary/[0.03]";

  function handleFlip() {
    setFlipping(true);
    setTimeout(() => setFlipping(false), 300);
    setDirection((d) => d === "CC_TO_SCU" ? "SCU_TO_CC" : "CC_TO_SCU");
    setAmount("");
    setConfirmed(false);
  }

  function handleInput(e: React.ChangeEvent<HTMLInputElement>) {
    setAmount(e.target.value.replace(/[^0-9.]/g, ""));
    setConfirmed(false);
  }

  function handlePreset(val: number) {
    setAmount(String(val));
    setConfirmed(false);
  }

  function handleConfirm() {
    if (!isValid) return;
    executeSwap(direction, parsed);
    setConfirmed(true);
  }

  const feeStr     = parsed > 0 ? `${fee.toFixed(2)} ${fromLabel}` : "—";
  const sendStr    = parsed > 0 ? `${parsed.toLocaleString()} ${fromLabel}` : "—";
  const receiveStr = output > 0
    ? `${output.toLocaleString(undefined, { maximumFractionDigits: 4 })} ${toLabel}`
    : "—";

  const outputDisplay = output > 0
    ? output.toLocaleString(undefined, { maximumFractionDigits: 4 })
    : "0";

  const btnLabel = confirmed
    ? "✓ SWAP CONFIRMED"
    : isValid
    ? `EXECUTE SWAP · ${parsed.toLocaleString()} ${fromLabel} → ${output.toLocaleString(undefined, { maximumFractionDigits: 2 })} ${toLabel}`
    : "ENTER AMOUNT";

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
            [SWP.000] · ASSET SWAP · {fromLabel} → {toLabel}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-1.5 bg-primary animate-pulse" />
          <span className="font-mono text-[9px] text-primary/60 tracking-[0.25em]">LIVE.RATE</span>
        </div>
      </div>

      {/* Page title */}
      <div className="relative bg-[#0d0d0d] border border-white/[0.06] px-7 py-6 flex items-end justify-between">
        <CornerMarks />
        <div>
          <p className="font-mono text-[8px] text-white/45 tracking-[0.35em] uppercase mb-1">
            Exchange // {fromLabel} for {toLabel}
          </p>
          <div className="flex items-baseline gap-4">
            <h1 className="font-mono text-4xl font-black tracking-tighter uppercase text-white">SWAP</h1>
            <div className="border border-primary/40 bg-primary/8 px-2 py-0.5">
              <span className="font-mono text-[8px] font-black text-primary tracking-[0.25em]">INSTANT</span>
            </div>
          </div>
        </div>
        <div className="text-right">
          <p className="font-mono text-[8px] text-white/45 tracking-[0.3em] uppercase mb-0.5">Rate</p>
          <p className="font-mono text-xl font-black tracking-tighter text-white">{rateLabel}</p>
        </div>
      </div>

      {/* Swap panel */}
      <div className="flex flex-col gap-0">

        {/* FROM */}
        <div className="relative bg-[#0d0d0d] border border-white/[0.06] p-6">
          <CornerMarks color={fromColor} />
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className={`w-1.5 h-1.5 ${isCCtoSCU ? "bg-primary" : "bg-[#22c55e]"}`} />
              <span className="font-mono text-[8px] text-white/55 tracking-[0.3em] uppercase">[SWP.001] // FROM</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-[8px] text-white/40 tracking-[0.2em] uppercase">Balance</span>
              <span className={`font-mono text-[9px] font-black tracking-wider ${fromAccent}`}>
                {fromBal.toLocaleString()} {fromLabel}
              </span>
            </div>
          </div>

          {/* Asset badge */}
          <div className="mb-4">
            <div className={`inline-flex items-center gap-2 border ${fromBorder} px-3 py-1.5`}>
              <span className={`font-mono text-xs font-black tracking-[0.15em] ${fromAccent}`}>{fromLabel}</span>
              <span className="font-mono text-[8px] text-white/45 tracking-widest">
                {isCCtoSCU ? "COMPUTE CREDITS" : "STD COMPUTE UNITS"}
              </span>
            </div>
          </div>

          {/* Input */}
          <div className={`relative border transition-colors ${
            isExcess
              ? "border-red-500/50 bg-red-500/5"
              : "border-white/[0.08] bg-white/[0.02]"
          }`}>
            <input
              type="text"
              inputMode="decimal"
              value={amount}
              onChange={handleInput}
              placeholder="0"
              className="w-full bg-transparent px-4 py-4 font-mono text-3xl font-black tracking-tighter text-white placeholder-white/15 outline-none"
            />
            <div className="absolute right-4 top-1/2 -translate-y-1/2">
              <span className="font-mono text-sm font-black text-white/30 tracking-[0.15em]">{fromLabel}</span>
            </div>
          </div>

          {isExcess && (
            <div className="flex items-center gap-2 mt-2">
              <AlertTriangle className="w-3 h-3 text-red-400" />
              <span className="font-mono text-[8px] text-red-400 tracking-[0.2em] uppercase">Insufficient balance</span>
            </div>
          )}

          {/* Quick presets */}
          <div className="grid grid-cols-4 gap-2 mt-4">
            {presets.map((p) => (
              <button
                key={p}
                onClick={() => handlePreset(p)}
                className={`border font-mono text-[9px] font-black tracking-[0.15em] py-2 transition-all uppercase ${
                  parsed === p
                    ? isCCtoSCU
                      ? "border-primary/50 bg-primary/10 text-primary"
                      : "border-[#22c55e]/50 bg-[#22c55e]/10 text-[#22c55e]"
                    : "border-white/[0.08] text-white/40 hover:border-white/20 hover:text-white/60"
                }`}
              >
                {p.toLocaleString()} {fromLabel}
              </button>
            ))}
          </div>
        </div>

        {/* Flip button */}
        <div className="flex items-center justify-center relative z-10">
          <div className="flex flex-col items-center">
            <div className="w-px h-5 bg-white/[0.06]" />
            <button
              onClick={handleFlip}
              className={`border border-primary/40 bg-[#0d0d0d] p-2.5 hover:border-primary hover:bg-primary/10 transition-all duration-200 group ${
                flipping ? "scale-90 opacity-60" : ""
              }`}
            >
              <ArrowUpDown className="w-4 h-4 text-primary/70 group-hover:text-primary transition-colors" />
            </button>
            <div className="w-px h-5 bg-white/[0.06]" />
          </div>
        </div>

        {/* TO */}
        <div className="relative bg-[#0d0d0d] border border-white/[0.06] p-6">
          <CornerMarks color={toColor} />
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className={`w-1.5 h-1.5 ${isCCtoSCU ? "bg-[#22c55e]" : "bg-primary"}`} />
              <span className="font-mono text-[8px] text-white/55 tracking-[0.3em] uppercase">[SWP.002] // TO</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-[8px] text-white/40 tracking-[0.2em] uppercase">Balance</span>
              <span className={`font-mono text-[9px] font-black tracking-wider ${toAccent}`}>
                {(isCCtoSCU ? scuBalance : ccBalance).toLocaleString()} {toLabel}
              </span>
            </div>
          </div>

          {/* Asset badge */}
          <div className="mb-4">
            <div className={`inline-flex items-center gap-2 border ${toBorder} px-3 py-1.5`}>
              <span className={`font-mono text-xs font-black tracking-[0.15em] ${toAccent}`}>{toLabel}</span>
              <span className="font-mono text-[8px] text-white/45 tracking-widest">
                {isCCtoSCU ? "STD COMPUTE UNITS" : "COMPUTE CREDITS"}
              </span>
            </div>
          </div>

          {/* Output — read only */}
          <div className={`relative border ${toBorder}`}>
            <div className="w-full px-4 py-4 font-mono text-3xl font-black tracking-tighter">
              <span className={output > 0 ? toAccent : "text-white/15"}>
                {outputDisplay}
              </span>
            </div>
            <div className="absolute right-4 top-1/2 -translate-y-1/2">
              <span className="font-mono text-sm font-black text-white/30 tracking-[0.15em]">{toLabel}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Transaction details */}
      <div className="relative bg-[#0d0d0d] border border-white/[0.06] px-6 py-5">
        <CornerMarks />
        <div className="flex items-center gap-2 mb-4">
          <Zap className="w-3 h-3 text-primary/50" />
          <span className="font-mono text-[8px] text-white/45 tracking-[0.35em] uppercase">[SWP.003] // TRANSACTION DETAILS</span>
        </div>

        <div className="space-y-2.5">
          {[
            { label: "Exchange Rate",      value: rateLabel,   accent: false },
            { label: "You Send",           value: sendStr,     accent: false },
            { label: "Network Fee (0.5%)", value: feeStr,      accent: false },
            { label: "You Receive",        value: receiveStr,  accent: true  },
          ].map(({ label, value, accent }) => (
            <div key={label} className="flex items-center justify-between">
              <span className="font-mono text-[9px] text-white/45 tracking-[0.2em] uppercase">{label}</span>
              <span className={`font-mono text-[10px] font-black tracking-wider ${accent ? toAccent : "text-white/70"}`}>
                {value}
              </span>
            </div>
          ))}
        </div>

        <div className="h-px bg-white/[0.04] my-4" />

        <div className="flex items-center gap-2">
          <div className="w-1 h-1 bg-primary/50" />
          <span className="font-mono text-[8px] text-white/35 tracking-[0.2em] uppercase">
            Swap executes instantly at the current market rate · No slippage
          </span>
        </div>
      </div>

      {/* Confirm button */}
      <button
        onClick={handleConfirm}
        disabled={!isValid}
        className={`relative w-full py-4 font-mono text-sm font-black tracking-[0.3em] uppercase transition-all duration-200 ${
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
        {btnLabel}
      </button>

    </div>
  );
}
