// ============================================================
// lib/mock-data.ts — Single source of truth for all mock data
// ============================================================
//
// World constants:
//   CC_BALANCE  = 150,100 CC
//   CAU total SCU capacity = 2,745 SCU (sum of all CAU assets)
//   CAU currently in use   = 1,547 SCU
//   SCU_BALANCE = 2,745 - 1,547 = 1,198 SCU (tradeable / loanable)
//   COMMITTED_SCU (loaned out to others, will return to pool)
//     = 200 + 450 + 350 = 1,000 SCU
// ============================================================


// ─── User ───────────────────────────────────────────────────

export const USER = {
  id:       "USER-0001",
  name:     "John Doe",
  tier:     "TIER_A",
  initials: "JD",
} as const;


// ─── Balances ───────────────────────────────────────────────

export const CC_BALANCE  = 150_100;   // Compute Credits
export const SCU_BALANCE = 1_198;     // Available tradeable SCU (total CAU capacity − in use)


// ─── Exchange / Fees ────────────────────────────────────────

export const EXCHANGE_RATE    = 12.5;   // 1 CC = 12.5 SCU
export const SWAP_FEE_PCT     = 0.005;  // 0.5%
export const PAYMENT_FEE_PCT  = 0.003;  // 0.3%
export const LOAN_FEE_PCT     = 0.010;  // 1.0%


// ─── Presets ────────────────────────────────────────────────

export const CC_SWAP_PRESETS    = [500, 1_000, 5_000, 10_000];  // CC → SCU amounts
export const SCU_SWAP_PRESETS   = [100, 500, 1_000, 5_000];     // SCU → CC amounts (5000 triggers "insufficient" UX)
export const CC_PAYMENT_PRESETS = [100, 500, 1_000, 5_000];
export const SCU_S_LOAN_PRESETS = [1, 5, 10, 50];               // SCU per second
export const DUR_LOAN_PRESETS   = [60, 300, 3_600, 86_400];     // seconds


// ─── CAU Types ──────────────────────────────────────────────

export type CAUType   = "GPU" | "CPU" | "RAM";
export type CAUTier   = "S" | "A" | "B" | "C";
export type CAUStatus = "active" | "idle" | "offline";

export interface CAU {
  id:           string;
  name:         string;
  model:        string;
  type:         CAUType;
  tier:         CAUTier;
  scu:          number;     // total SCU capacity
  scuUsed:      number;     // currently allocated SCU
  temp:         number;     // °C
  clock:        string;     // e.g. "2.52 GHz"
  power:        number;     // watts
  utilPct:      number;     // 0–100
  vram?:        string;     // GPU only
  cores?:       number;     // CPU only
  capacity?:    string;     // RAM only
  status:       CAUStatus;
  acquiredDate: string;
}

// Total capacity: 2,745 SCU  |  In use: 1,547 SCU  |  Available: 1,198 SCU
export const CAU_ASSETS: CAU[] = [
  {
    id: "CAU-001", name: "TITAN-ALPHA", model: "NVIDIA RTX 4090",
    type: "GPU", tier: "S",
    scu: 1_200, scuUsed: 882,
    temp: 74, clock: "2.52 GHz", power: 418, utilPct: 73,
    vram: "24 GB GDDR6X",
    status: "active", acquiredDate: "2024-01-15",
  },
  {
    id: "CAU-002", name: "CORE-PRIME", model: "AMD Threadripper 5995WX",
    type: "CPU", tier: "S",
    scu: 480, scuUsed: 312,
    temp: 68, clock: "4.5 GHz", power: 280, utilPct: 65,
    cores: 64,
    status: "active", acquiredDate: "2024-01-15",
  },
  {
    id: "CAU-003", name: "VEGA-NODE", model: "NVIDIA RTX 3080",
    type: "GPU", tier: "A",
    scu: 680, scuUsed: 204,
    temp: 61, clock: "1.71 GHz", power: 320, utilPct: 30,
    vram: "10 GB GDDR6X",
    status: "active", acquiredDate: "2024-03-08",
  },
  {
    id: "CAU-004", name: "NEXUS-9K", model: "Intel Core i9-13900K",
    type: "CPU", tier: "B",
    scu: 220, scuUsed: 44,
    temp: 45, clock: "5.8 GHz", power: 125, utilPct: 20,
    cores: 24,
    status: "idle", acquiredDate: "2024-05-22",
  },
  {
    id: "CAU-005", name: "BUFFER-ECC", model: "DDR5-6400 64GB ECC",
    type: "RAM", tier: "A",
    scu: 120, scuUsed: 96,
    temp: 38, clock: "6400 MT/s", power: 12, utilPct: 80,
    capacity: "64 GB ECC",
    status: "active", acquiredDate: "2024-01-15",
  },
  {
    id: "CAU-006", name: "CACHE-32", model: "DDR4-3600 32GB",
    type: "RAM", tier: "C",
    scu: 45, scuUsed: 9,
    temp: 32, clock: "3600 MT/s", power: 6, utilPct: 20,
    capacity: "32 GB",
    status: "idle", acquiredDate: "2024-07-03",
  },
];

export const CAU_TOTAL_SCU = CAU_ASSETS.reduce((s, c) => s + c.scu,     0); // 2,745
export const CAU_USED_SCU  = CAU_ASSETS.reduce((s, c) => s + c.scuUsed, 0); // 1,547


// ─── SCU Usage (task manager) ───────────────────────────────

export interface SCUProcess {
  name:        string;
  key:         string;
  color:       string;
  compute:     number;  // SCU currently in use by this process
  loaned:      number;  // SCU borrowed from external nodes for this process
  loanedFrom:  string;
  loanedTill:  string;
  pct:         number;  // share of total usage (0–100)
  status:      "active" | "idle";
  origin:      string;
}

export const SCU_PROCESSES: SCUProcess[] = [
  { name: "Model Inference",  key: "inference",      color: "#fa04fa", compute: 24, loaned: 8, loanedFrom: "10:00", loanedTill: "10:45", pct: 46, status: "active", origin: "Node-Cluster-A" },
  { name: "Data Processing",  key: "dataProcessing", color: "#fa04fa", compute: 14, loaned: 4, loanedFrom: "10:05", loanedTill: "11:00", pct: 27, status: "active", origin: "Node-Cluster-B" },
  { name: "Network Routing",  key: "networkRouting", color: "#c084fc", compute: 9,  loaned: 0, loanedFrom: "—",     loanedTill: "—",     pct: 17, status: "active", origin: "Node-Cluster-A" },
  { name: "Storage I/O",      key: "storageIO",      color: "#22c55e", compute: 5,  loaned: 2, loanedFrom: "09:50", loanedTill: "10:30", pct: 10, status: "idle",   origin: "Node-Cluster-C" },
];

export const SCU_TOTAL_CAPACITY = 60;  // session compute budget (SCU units)

export interface ChartDataPoint {
  time:           string;
  inference:      number;
  dataProcessing: number;
  networkRouting: number;
  storageIO:      number;
  power:          number;  // total stacked (used by area chart)
  limit:          number;  // capacity ceiling
}

export const SCU_CHART_DATA: ChartDataPoint[] = [
  { time: "10:00", inference: 18, dataProcessing: 10, networkRouting: 7, storageIO: 5, power: 40, limit: 45 },
  { time: "10:05", inference: 6,  dataProcessing: 4,  networkRouting: 3, storageIO: 2, power: 15, limit: 60 },
  { time: "10:10", inference: 20, dataProcessing: 12, networkRouting: 8, storageIO: 5, power: 45, limit: 50 },
  { time: "10:15", inference: 8,  dataProcessing: 6,  networkRouting: 4, storageIO: 2, power: 20, limit: 58 },
  { time: "10:20", inference: 3,  dataProcessing: 2,  networkRouting: 2, storageIO: 1, power: 8,  limit: 42 },
  { time: "10:25", inference: 24, dataProcessing: 14, networkRouting: 9, storageIO: 5, power: 52, limit: 55 },
  { time: "10:30", inference: 10, dataProcessing: 8,  networkRouting: 5, storageIO: 2, power: 25, limit: 45 },
  { time: "10:35", inference: 4,  dataProcessing: 3,  networkRouting: 2, storageIO: 1, power: 10, limit: 50 },
];


// ─── Committed SCU ──────────────────────────────────────────
// SCU the user has loaned OUT to other nodes; will return to
// SCU_BALANCE when each commitment expires.
// Total returning: 200 + 450 + 350 = 1,000 SCU
// Max pool after all returns: SCU_BALANCE (1,198) + 1,000 = 2,198 SCU

export interface CommittedSlot {
  label:        string;
  origin:       string;
  scuReturning: number;
  returnsInMin: number;
}

export const COMMITTED_SCU: CommittedSlot[] = [
  { label: "STORAGE I/O",     origin: "Node-Cluster-C", scuReturning: 200, returnsInMin: 18 },
  { label: "MODEL INFERENCE", origin: "Node-Cluster-A", scuReturning: 450, returnsInMin: 33 },
  { label: "DATA PROCESSING", origin: "Node-Cluster-B", scuReturning: 350, returnsInMin: 48 },
];


// ─── Transactions ───────────────────────────────────────────

export type TxType   = "OUT" | "IN";
export type TxStatus = "COMPLETE" | "PENDING" | "REJECTED";

export interface Transaction {
  id:           string;
  desc:         string;
  type:         TxType;
  amount:       number;
  counterparty: string;
  status:       TxStatus;
  date:         string;
  time:         string;
  note:         string;
  category:     string;
}

export const TRANSACTIONS: Transaction[] = [
  {
    id: "TXN-0001",
    desc: "BANANA · PRODUCE MARKET",
    type: "OUT",
    amount: 1_000,
    counterparty: "EVIL INC",
    status: "COMPLETE",
    date: "2026-03-21",
    time: "15:10:00",
    note: "Bulk produce purchase — 50 kg banana crate",
    category: "FOOD",
  },
  {
    id: "TXN-0002",
    desc: "CREDIT TOPUP · EXCHANGE DESK",
    type: "IN",
    amount: 2_500,
    counterparty: "EXCHANGE · NODE-7",
    status: "COMPLETE",
    date: "2026-03-21",
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
    status: "PENDING",
    date: "2026-03-20",
    time: "08:03:17",
    note: "1× cold brew, 250 ml",
    category: "FOOD",
  },
  {
    id: "TXN-0004",
    desc: "BOOK RENTAL · LIBRARY NODE",
    type: "OUT",
    amount: 3,
    counterparty: "LIB-NODE-01 · ARCHIVE",
    status: "REJECTED",
    date: "2026-03-19",
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
    date: "2026-03-18",
    time: "03:30:00",
    note: "Trade settled — 3× protein bar",
    category: "TRADE",
  },
];


// ─── Color maps (shared across pages) ───────────────────────

export const STATUS_COLOR: Record<TxStatus, string> = {
  COMPLETE: "#22c55e",
  PENDING:  "#fbbf24",
  REJECTED: "#ef4444",
};

export const TX_TYPE_COLOR: Record<TxType, string> = {
  OUT: "#ef4444",
  IN:  "#22c55e",
};

export const CAU_TYPE_COLOR: Record<CAUType, string> = {
  GPU: "#fa04fa",
  CPU: "#c084fc",
  RAM: "#22c55e",
};

export const CAU_TIER_COLOR: Record<CAUTier, string> = {
  S: "#fbbf24",
  A: "#fa04fa",
  B: "#c084fc",
  C: "#22c55e",
};

export const CAU_TIER_LABEL: Record<CAUTier, string> = {
  S: "TIER-S · ELITE",
  A: "TIER-A · HIGH",
  B: "TIER-B · MID",
  C: "TIER-C · ENTRY",
};
