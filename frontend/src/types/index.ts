// ComputeBank domain types
// All timestamps are number (ms epoch via Date.now()) — NEVER Date objects.
// Reason: Date objects are not serializable across the Next.js Server/Client boundary
// and cause hydration errors.

// ---------------------------------------------------------------------------
// Urgency level — drives the entire colour and animation system
// Used by: lib/constants/urgency.ts, Phase 2 asset cards, Phase 3 SCU chart,
//          Phase 4 lease Gantt bars
// ---------------------------------------------------------------------------
export type UrgencyLevel = 'healthy' | 'warning' | 'critical' | 'expired'

// ---------------------------------------------------------------------------
// CAU — Compute Asset Unit: the underlying hardware asset
// Represents physical compute capacity owned by the user.
// productionRatePerHour: SCU generated per hour by this CAU allocation.
// ---------------------------------------------------------------------------
export interface CAU {
  id: string
  totalUnits: number             // e.g. 100_000_000 (100M units)
  productionRatePerHour: number  // SCU generated per hour
}

// ---------------------------------------------------------------------------
// SCU — Standard Compute Unit: the spendable flow
// available + reserved + leasedOut should approximately equal total.
// available can be less than total if SCU has been consumed or is reserved.
// ---------------------------------------------------------------------------
export interface SCU {
  available: number   // SCU available for use right now
  consumed: number    // SCU consumed (spent) — historical
  reserved: number    // SCU reserved for pending operations
  leasedOut: number   // SCU currently leased out to counterparties
  total: number       // Total SCU capacity (from CAU)
}

// ---------------------------------------------------------------------------
// CC — Compute Credits: the liquid currency
// balance can go negative — this is the debt state shown in Phase 2 and 4.
// Dollar-formatted for display (e.g. -$1,847 when balance is -1847).
// ---------------------------------------------------------------------------
export interface CC {
  balance: number  // Positive = credit, negative = debt
}

// ---------------------------------------------------------------------------
// Lease — An active compute lease between two parties
// direction: 'outbound' = this user is lending SCU to counterparty
//            'inbound'  = this user is renting SCU from counterparty
// Timestamps as number (ms epoch) — CRITICAL for hydration safety.
// scuPerHour: the rate at which SCU flows (determines CC charges).
// ---------------------------------------------------------------------------
export interface Lease {
  id: string
  counterparty: string
  scuAmount: number              // Total SCU committed to this lease
  scuPerHour: number             // Rate of SCU flow (determines CC cost)
  direction: 'outbound' | 'inbound'
  startedAt: number              // ms epoch — use Date.now() arithmetic
  expiresAt: number              // ms epoch — use Date.now() arithmetic
}

// ---------------------------------------------------------------------------
// Transaction — A CC transaction event (appears in Phase 3 CC history list)
// amount: positive = received, negative = sent/charged
// direction mirrors amount sign: 'in' = positive, 'out' = negative
// ---------------------------------------------------------------------------
export interface Transaction {
  id: string
  counterparty: string
  amount: number                 // Positive = received, negative = sent
  direction: 'in' | 'out'
  timestamp: number              // ms epoch
  description: string
}

// ---------------------------------------------------------------------------
// Portfolio — The complete asset snapshot for one user
// This is the top-level data shape imported by asset card components.
// ---------------------------------------------------------------------------
export interface Portfolio {
  userId: string
  userName: string
  cau: CAU
  scu: SCU
  cc: CC
}
