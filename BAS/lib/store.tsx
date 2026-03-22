"use client";

// ============================================================
// lib/store.tsx — Global reactive state for balances & history
// Wrap the app with <StoreProvider>; consume with useStore().
// ============================================================

import { createContext, useContext, useState, useRef, ReactNode } from "react";
import {
  CC_BALANCE as INIT_CC,
  SCU_BALANCE as INIT_SCU,
  TRANSACTIONS as INIT_TXN,
  EXCHANGE_RATE,
  SWAP_FEE_PCT,
  PAYMENT_FEE_PCT,
  LOAN_FEE_PCT,
  type Transaction,
} from "./mock-data";

// ─── Store interface ────────────────────────────────────────

interface AppStore {
  ccBalance:    number;
  scuBalance:   number;
  transactions: Transaction[];
  /** CC ↔ SCU swap. amount = units of the FROM currency. */
  executeSwap:  (direction: "CC_TO_SCU" | "SCU_TO_CC", amount: number) => void;
  /** CC payment to a peer. */
  executePayment: (amount: number, recipient: string, note: string) => void;
  /** SCU streaming loan to a peer. Deducts from SCU balance only. */
  executeLoan:  (scuPerSec: number, durationSec: number, recipient: string, note: string) => void;
}

// ─── Context ────────────────────────────────────────────────

const StoreCtx = createContext<AppStore | null>(null);

// ─── Provider ───────────────────────────────────────────────

export function StoreProvider({ children }: { children: ReactNode }) {
  const [ccBalance,    setCc]   = useState(INIT_CC);
  const [scuBalance,   setScu]  = useState(INIT_SCU);
  const [transactions, setTxns] = useState<Transaction[]>(INIT_TXN);

  // monotonic counter so IDs don't clash with static ones (0001–0005)
  const txCounter = useRef(INIT_TXN.length + 1);

  function addTxn(partial: Omit<Transaction, "id" | "date" | "time">) {
    const id   = `TXN-${String(txCounter.current++).padStart(4, "0")}`;
    const now  = new Date();
    const date = now.toISOString().slice(0, 10);
    const time = now.toTimeString().slice(0, 8);
    setTxns((prev) => [{ id, date, time, ...partial }, ...prev]);
  }

  function executeSwap(direction: "CC_TO_SCU" | "SCU_TO_CC", amount: number) {
    const fee = amount * SWAP_FEE_PCT;
    const net = amount - fee;

    if (direction === "CC_TO_SCU") {
      const scuOut = net * EXCHANGE_RATE;
      setCc((b)  => Math.max(0, b - amount));
      setScu((b) => b + scuOut);
      addTxn({
        desc:         "ASSET SWAP · CC → SCU",
        type:         "OUT",
        amount,
        counterparty: "EXCHANGE · SWAP NODE",
        status:       "COMPLETE",
        note:         `Swapped ${amount.toLocaleString()} CC → ${scuOut.toLocaleString(undefined, { maximumFractionDigits: 2 })} SCU (fee ${fee.toFixed(2)} CC)`,
        category:     "SWAP",
      });
    } else {
      const ccOut = net / EXCHANGE_RATE;
      setScu((b) => Math.max(0, b - amount));
      setCc((b)  => b + ccOut);
      addTxn({
        desc:         "ASSET SWAP · SCU → CC",
        type:         "IN",
        amount:       Math.round(ccOut * 100) / 100,
        counterparty: "EXCHANGE · SWAP NODE",
        status:       "COMPLETE",
        note:         `Swapped ${amount.toLocaleString()} SCU → ${ccOut.toLocaleString(undefined, { maximumFractionDigits: 4 })} CC (fee ${fee.toFixed(2)} SCU)`,
        category:     "SWAP",
      });
    }
  }

  function executePayment(amount: number, recipient: string, note: string) {
    const fee   = amount * PAYMENT_FEE_PCT;
    const total = amount + fee;
    setCc((b) => Math.max(0, b - total));
    addTxn({
      desc:         `PAYMENT · ${recipient.toUpperCase()}`,
      type:         "OUT",
      amount,
      counterparty: recipient.toUpperCase(),
      status:       "COMPLETE",
      note:         note || "CC transfer",
      category:     "PAYMENT",
    });
  }

  function executeLoan(scuPerSec: number, durationSec: number, recipient: string, note: string) {
    const total = scuPerSec * durationSec;
    const fee   = total * LOAN_FEE_PCT;
    setScu((b) => Math.max(0, b - (total + fee)));
    // SCU loans don't appear in the CC ledger — they only affect SCU balance
  }

  return (
    <StoreCtx.Provider value={{ ccBalance, scuBalance, transactions, executeSwap, executePayment, executeLoan }}>
      {children}
    </StoreCtx.Provider>
  );
}

// ─── Hook ───────────────────────────────────────────────────

export function useStore(): AppStore {
  const ctx = useContext(StoreCtx);
  if (!ctx) throw new Error("useStore must be used inside <StoreProvider>");
  return ctx;
}
