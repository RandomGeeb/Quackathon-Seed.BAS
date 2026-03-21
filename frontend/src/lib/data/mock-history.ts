import type { Transaction } from '@/types'

const NOW  = Date.now()
const MIN  = 60_000
const HOUR = 3_600_000

// ---------------------------------------------------------------------------
// MOCK_HISTORY — CC transaction log for Aria Chen
//
// Story: Aria recently purchased a batch of SCU (large debit), received
// payment from Arch-Node-7 (inbound lease payment), sent compute fees to
// NovaTech (outbound), and paid a network fee. Net result: slightly negative.
// Amounts are irregular to look real. Ordered newest first.
// ---------------------------------------------------------------------------
export const MOCK_HISTORY: Transaction[] = [
  {
    id:           'txn-001',
    counterparty: 'NovaTech Systems',
    amount:       -2_340,
    direction:    'out',
    timestamp:    NOW - 23 * MIN,
    description:  'SCU lease fee — 340K SCU × 8hr',
  },
  {
    id:           'txn-002',
    counterparty: 'Arch-Node-7',
    amount:       +1_873,
    direction:    'in',
    timestamp:    NOW - 1 * HOUR - 12 * MIN,
    description:  'Inbound lease payment — 820K SCU × 2hr',
  },
  {
    id:           'txn-003',
    counterparty: 'Cluster-Omega',
    amount:       -914,
    direction:    'out',
    timestamp:    NOW - 2 * HOUR - 7 * MIN,
    description:  'SCU lease fee — 180K SCU × 4hr',
  },
  {
    id:           'txn-004',
    counterparty: 'Network Protocol',
    amount:       -466,
    direction:    'out',
    timestamp:    NOW - 3 * HOUR - 38 * MIN,
    description:  'Network routing fee',
  },
  {
    id:           'txn-005',
    counterparty: 'Meridian Exchange',
    amount:       +3_210,
    direction:    'in',
    timestamp:    NOW - 5 * HOUR - 14 * MIN,
    description:  'CC purchase — SCU swap',
  },
  {
    id:           'txn-006',
    counterparty: 'NovaTech Systems',
    amount:       -4_200,
    direction:    'out',
    timestamp:    NOW - 6 * HOUR - 55 * MIN,
    description:  'SCU block purchase — 500K SCU',
  },
  {
    id:           'txn-007',
    counterparty: 'Arch-Node-7',
    amount:       +1_100,
    direction:    'in',
    timestamp:    NOW - 9 * HOUR - 3 * MIN,
    description:  'Inbound lease payment — 820K SCU × initial',
  },
  {
    id:           'txn-008',
    counterparty: 'Network Protocol',
    amount:       -110,
    direction:    'out',
    timestamp:    NOW - 10 * HOUR - 27 * MIN,
    description:  'Network maintenance fee',
  },
]

// ---------------------------------------------------------------------------
// SCU_DataPoint — shape for chart time-series data
// Used by Phase 3 SCU Activity Monitor (Recharts AreaChart / LineChart).
// Phase 3 will import this type from here — no need to add to types/index.ts
// as it is chart-specific and not a domain entity.
// ---------------------------------------------------------------------------
export interface SCU_DataPoint {
  timestamp: number   // ms epoch
  available: number   // SCU available at that moment
  cauThreshold: number // CAU natural production threshold (horizontal reference line)
}

// ---------------------------------------------------------------------------
// MOCK_SCU_HISTORY — Rolling 8-hour window of available SCU readings
//
// Story: SCU was healthy, then dropped sharply when NovaTech lease started
// (V-dip pattern). Partially recovered as CAU produced more. Approaching
// zero now because the lease is draining SCU.
//
// Points are at irregular intervals (~every 15–25 min) to look like real telemetry.
// cauThreshold is constant (4,320 SCU/hr × 24hr = ~103,680 SCU as threshold band).
// Use a representative threshold value: 500_000 (chosen for chart scale visibility).
// ---------------------------------------------------------------------------
export const MOCK_SCU_HISTORY: SCU_DataPoint[] = [
  { timestamp: NOW - 8 * HOUR,                      available: 4_823_410, cauThreshold: 500_000 },
  { timestamp: NOW - 7 * HOUR - 42 * MIN,           available: 4_791_230, cauThreshold: 500_000 },
  { timestamp: NOW - 7 * HOUR - 18 * MIN,           available: 4_834_670, cauThreshold: 500_000 },
  { timestamp: NOW - 6 * HOUR - 55 * MIN,           available: 4_312_180, cauThreshold: 500_000 }, // purchased SCU dip
  { timestamp: NOW - 6 * HOUR - 28 * MIN,           available: 4_198_450, cauThreshold: 500_000 },
  { timestamp: NOW - 6 * HOUR,                      available: 4_056_730, cauThreshold: 500_000 },
  { timestamp: NOW - 5 * HOUR - 37 * MIN,           available: 3_921_840, cauThreshold: 500_000 },
  { timestamp: NOW - 5 * HOUR - 12 * MIN,           available: 3_787_610, cauThreshold: 500_000 },
  { timestamp: NOW - 4 * HOUR - 48 * MIN,           available: 3_645_920, cauThreshold: 500_000 },
  { timestamp: NOW - 4 * HOUR - 22 * MIN,           available: 3_412_380, cauThreshold: 500_000 },
  { timestamp: NOW - 4 * HOUR,                      available: 2_134_560, cauThreshold: 500_000 }, // Cluster-Omega lease starts (V-dip)
  { timestamp: NOW - 3 * HOUR - 41 * MIN,           available: 1_987_340, cauThreshold: 500_000 },
  { timestamp: NOW - 3 * HOUR - 17 * MIN,           available: 1_843_210, cauThreshold: 500_000 },
  { timestamp: NOW - 2 * HOUR - 52 * MIN,           available: 1_712_460, cauThreshold: 500_000 },
  { timestamp: NOW - 2 * HOUR - 28 * MIN,           available: 1_589_730, cauThreshold: 500_000 },
  { timestamp: NOW - 2 * HOUR,                      available: 1_423_810, cauThreshold: 500_000 }, // Arch-Node-7 inbound lease starts (partial recovery)
  { timestamp: NOW - 1 * HOUR - 43 * MIN,           available: 1_318_920, cauThreshold: 500_000 },
  { timestamp: NOW - 1 * HOUR - 19 * MIN,           available: 1_247_340, cauThreshold: 500_000 },
  { timestamp: NOW - 58 * MIN,                      available: 1_187_650, cauThreshold: 500_000 },
  { timestamp: NOW - 35 * MIN,                      available: 1_134_210, cauThreshold: 500_000 },
  { timestamp: NOW - 23 * MIN,                      available: 1_098_560, cauThreshold: 500_000 }, // NovaTech fee charged
  { timestamp: NOW - 12 * MIN,                      available: 1_091_340, cauThreshold: 500_000 },
  { timestamp: NOW - 4 * MIN,                       available: 1_087_340, cauThreshold: 500_000 }, // current value (matches MOCK_PORTFOLIO.scu.available)
]
