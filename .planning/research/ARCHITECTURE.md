# Architecture Patterns

**Domain:** Next.js fintech dashboard (compute-as-currency)
**Project:** ComputeBank
**Researched:** 2026-03-21
**Confidence:** MEDIUM — Next.js App Router routing verified via official docs (HIGH). shadcn/ui + Recharts patterns from training data; WebFetch denied for direct doc verification. Patterns are well-established and consistent across community usage.

---

## Recommended Architecture

### Top-Level Mental Model

```
app/                          ← Next.js App Router root
  layout.tsx                  ← Root shell (fonts, theme provider, global CSS)
  (dashboard)/                ← Route group — no URL segment added
    layout.tsx                ← Dashboard shell (sidebar nav, header)
    page.tsx                  ← Main dashboard view (/ route)
    leases/
      page.tsx                ← Lease detail / full Gantt view
    history/
      page.tsx                ← Transaction history table

lib/
  data/
    mock-portfolio.ts         ← Static mocked asset balances (CAU, SCU, CC)
    mock-leases.ts            ← Active lease objects with expiry timestamps
    mock-history.ts           ← Transaction history rows
    mock-forecast.ts          ← SCU depletion forecast time-series data
  hooks/
    use-countdown.ts          ← Countdown timer hook (setInterval → state)
    use-lease-status.ts       ← Derives green/yellow/red status from lease data

components/
  ui/                         ← shadcn/ui primitives (auto-generated, do not edit)
  cards/
    AssetCard.tsx             ← Single CAU / SCU / CC balance card
    AssetCardGrid.tsx         ← Renders three AssetCards in a row
  charts/
    ScuAllocationChart.tsx    ← Donut chart: available/consumed/reserved/leased
    CcBalanceChart.tsx        ← Area chart: CC history, red fill below zero
    ScuForecastChart.tsx      ← Line chart: projected SCU depletion
  leases/
    LeasePanel.tsx            ← Container for all active leases
    LeaseRow.tsx              ← Single Gantt bar + countdown + status badge
    CountdownTimer.tsx        ← Pure display: HH:MM:SS from seconds remaining
  history/
    HistoryTable.tsx          ← Tabular transaction list with sortable columns
  send/
    SendScuModal.tsx          ← Modal/drawer: initiate compute loan flow
  layout/
    DashboardNav.tsx          ← Sidebar/top nav with route links
    DashboardHeader.tsx       ← Header bar: user identity (mocked), global status

types/
  index.ts                    ← Shared TypeScript interfaces
```

---

## Component Boundaries

| Component | Responsibility | Communicates With | Server/Client |
|-----------|---------------|-------------------|---------------|
| `app/(dashboard)/layout.tsx` | Shell layout, nav | Renders `DashboardNav`, `DashboardHeader`, children | Server Component |
| `app/(dashboard)/page.tsx` | Assembles main dashboard | Imports all section components, passes mock data as props | Server Component |
| `AssetCardGrid` | Layout wrapper | Renders three `AssetCard` | Server Component |
| `AssetCard` | Displays balance + delta | Receives `{ label, balance, unit, delta }` as props | Server Component |
| `ScuAllocationChart` | Donut chart | Receives `{ available, consumed, reserved, leased }` | **Client Component** (Recharts) |
| `CcBalanceChart` | Area chart w/ debt fill | Receives `{ data: TimeSeriesPoint[] }` | **Client Component** (Recharts) |
| `ScuForecastChart` | Line chart + zero crossing | Receives `{ data: TimeSeriesPoint[], forecastZeroAt: Date }` | **Client Component** (Recharts) |
| `LeasePanel` | Container for leases | Receives `{ leases: Lease[] }`, renders `LeaseRow` list | **Client Component** (owns timer tick) |
| `LeaseRow` | Single Gantt bar + timer | Receives `{ lease: Lease, now: number }`, uses `use-countdown` | **Client Component** |
| `CountdownTimer` | Pure display: H:M:S | Receives `{ secondsRemaining: number }` | **Client Component** |
| `HistoryTable` | Transaction rows | Receives `{ rows: Transaction[] }` | Server Component (no interactivity needed) |
| `SendScuModal` | Loan initiation form | Receives `onSubmit` handler, self-contained form state | **Client Component** |

### Server vs Client boundary rule

Static display + data fetching = Server Component (renders on server, zero JS sent for that subtree).
Timers, Recharts, interactive forms = Client Component (`"use client"` directive required). The page-level Server Component passes mocked data as serializable props to Client Component islands.

---

## Data Flow

```
lib/data/mock-*.ts
  (plain TypeScript modules, imported statically)
        |
        v
app/(dashboard)/page.tsx   [Server Component — no async needed since mocked]
  |  imports mock data directly, constructs typed props
  |
  +---> <AssetCardGrid>        props: { assets: Asset[] }
  |         [Server Component, pure display]
  |
  +---> <ScuAllocationChart>   props: { allocation: ScuAllocation }
  |         [Client Component — "use client"]
  |         Uses Recharts PieChart/RadialBarChart
  |
  +---> <ScuForecastChart>     props: { forecast: TimeSeriesPoint[] }
  |         [Client Component]
  |         Uses Recharts LineChart with reference line at y=0
  |
  +---> <CcBalanceChart>       props: { history: TimeSeriesPoint[] }
  |         [Client Component]
  |         Uses Recharts AreaChart, custom gradient fill below zero
  |
  +---> <LeasePanel>           props: { leases: Lease[] }
            [Client Component — owns the timer heartbeat]
            useEffect → setInterval(1000) → updates `now` state
            passes `now` down to each <LeaseRow> as a prop
                  |
                  +---> <LeaseRow>  props: { lease, now }
                              derives `secondsRemaining = lease.expiresAt - now`
                              derives status = green|yellow|red from thresholds
                              renders Gantt bar width as % of lease duration
                              renders <CountdownTimer secondsRemaining={...} />
```

### Key data flow rules

1. **Mock data lives in `lib/data/`** — pure TypeScript, no React, no side effects. Swap for real API calls later without touching components.
2. **Props are serializable** — Server Components pass plain objects/arrays to Client Components. Never pass class instances, functions, or Dates (pass `Date.getTime()` as number instead).
3. **Timer state lives in `LeasePanel`** — one `setInterval` drives all lease timers. `LeaseRow` and `CountdownTimer` are pure derivations from `now` prop. This prevents N independent intervals from running.
4. **Charts receive pre-shaped data** — no data transformation inside chart components. Shape data in `lib/data/` or in the page before passing as props.
5. **Urgency state is derived, not stored** — `LeaseRow` computes `green/yellow/red` from `secondsRemaining` at render time. No state machines needed.

---

## Page and Route Structure

```
/                   ← Main dashboard (AssetCards + all charts + LeasePanel)
/leases             ← Expanded lease view (full Gantt, more detail per lease)
/history            ← Full transaction/history table
```

Use `(dashboard)` route group so all three routes share the sidebar + header layout without a URL segment for "dashboard".

For a hackathon, a single-page layout with scroll sections is also valid — `/leases` and `/history` as separate routes adds nav polish but is optional scope.

---

## How Countdown Timers Integrate With Chart Data

Countdown timers and charts are decoupled by design. They share the same mocked `Lease[]` data but update independently:

```
Lease[] data (static mock)
  |
  +-----> LeasePanel (Client Component)
  |           setInterval → `now` state → drives CountdownTimer displays
  |           When lease expires: setInterval detects secondsRemaining <= 0
  |               → show "EXPIRED" badge, stop individual countdown display
  |
  +-----> ScuAllocationChart (Client Component)
              reads current allocation snapshot from mock data
              does NOT update on timer tick — it's a snapshot
              (if live reallocation is desired in future: pass `now` as a prop
               and re-derive `leased` value from active leases)
```

The SCU depletion forecast line does not need the timer — it is a pre-computed time series projected from burn rate. The timer-driven live urgency is isolated to the `LeasePanel` tree.

**If live chart updates on lease expiry are desired** (out of scope for v1 but noted for roadmap): lift `now` from `LeasePanel` to the page level and pass it to both `LeasePanel` and `ScuAllocationChart`. The allocation chart would then recompute `leased` SCU by filtering only unexpired leases.

---

## Patterns to Follow

### Pattern 1: Single-Source Mock Data Module

**What:** All mocked data is defined in `lib/data/` as plain typed objects exported from named modules. No data defined inline in components.

**When:** Always — even for a hackathon. It takes 10 minutes to set up and saves hours of find-and-replace when the design changes.

**Example:**
```typescript
// lib/data/mock-leases.ts
import type { Lease } from "@/types"

const NOW = Date.now()
const HOUR = 3600 * 1000

export const MOCK_LEASES: Lease[] = [
  {
    id: "lease-001",
    counterparty: "Node-Alpha",
    scuAmount: 240,
    startedAt: NOW - 2 * HOUR,
    expiresAt: NOW + 0.5 * HOUR,   // expires in 30 min → yellow/red
  },
  {
    id: "lease-002",
    counterparty: "Cluster-7",
    scuAmount: 800,
    startedAt: NOW - 1 * HOUR,
    expiresAt: NOW + 6 * HOUR,     // expires in 6 hours → green
  },
]
```

### Pattern 2: Client Component Islands

**What:** Wrap only the interactive/browser-API-dependent parts in `"use client"`. Static display wrapping stays Server.

**When:** Charts (Recharts uses browser APIs), timers (`setInterval`), modal forms.

**Example:**
```typescript
// components/charts/ScuAllocationChart.tsx
"use client"

import { PieChart, Pie, Cell, Tooltip } from "recharts"

interface ScuAllocationChartProps {
  available: number
  consumed: number
  reserved: number
  leased: number
}

export function ScuAllocationChart(props: ScuAllocationChartProps) {
  const data = [
    { name: "Available", value: props.available, color: "#22c55e" },
    { name: "Consumed", value: props.consumed, color: "#ef4444" },
    { name: "Reserved", value: props.reserved, color: "#f59e0b" },
    { name: "Leased Out", value: props.leased, color: "#6366f1" },
  ]
  return (
    <PieChart width={300} height={300}>
      <Pie data={data} dataKey="value" innerRadius={80} outerRadius={130}>
        {data.map((entry) => (
          <Cell key={entry.name} fill={entry.color} />
        ))}
      </Pie>
      <Tooltip />
    </PieChart>
  )
}
```

### Pattern 3: Single Timer Heartbeat in LeasePanel

**What:** One `setInterval(1000)` in `LeasePanel` updates a `now` state. All `LeaseRow` children receive `now` as a prop and compute their countdowns from it.

**When:** Any component tree with multiple countdowns that need to tick synchronously.

**Example:**
```typescript
// components/leases/LeasePanel.tsx
"use client"

import { useState, useEffect } from "react"
import type { Lease } from "@/types"
import { LeaseRow } from "./LeaseRow"

export function LeasePanel({ leases }: { leases: Lease[] }) {
  const [now, setNow] = useState(Date.now())

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(id)
  }, [])

  return (
    <div className="space-y-2">
      {leases.map((lease) => (
        <LeaseRow key={lease.id} lease={lease} now={now} />
      ))}
    </div>
  )
}
```

### Pattern 4: Urgency Derivation from Thresholds

**What:** Compute green/yellow/red purely from `secondsRemaining`. Define thresholds once in a constants file.

**When:** Any status-driven styling.

**Example:**
```typescript
// lib/urgency.ts
export type UrgencyLevel = "green" | "yellow" | "red" | "expired"

export const URGENCY_THRESHOLDS = {
  yellow: 3600,   // < 1 hour → yellow
  red: 900,       // < 15 min → pulsing red
}

export function getUrgencyLevel(secondsRemaining: number): UrgencyLevel {
  if (secondsRemaining <= 0) return "expired"
  if (secondsRemaining < URGENCY_THRESHOLDS.red) return "red"
  if (secondsRemaining < URGENCY_THRESHOLDS.yellow) return "yellow"
  return "green"
}
```

### Pattern 5: Recharts Area Chart With Debt Fill

**What:** CcBalanceChart uses a custom gradient that fills red below zero and neutral above. Requires a `defs` gradient referencing `y=0` as the split point.

**When:** Any chart requiring a zero-crossing fill color change.

**Example (sketch):**
```typescript
// The key is using linearGradient with gradientUnits="userSpaceOnUse"
// and stop-offsets derived from the chart's y-axis domain
// Recharts does not natively support zero-crossing gradients;
// use a customized gradient defs block inside the <AreaChart>
// Confidence: MEDIUM — this pattern exists in community examples
// but requires manual offset calculation based on the yAxis domain.
```

---

## Anti-Patterns to Avoid

### Anti-Pattern 1: Timer Per Lease Row

**What:** Each `LeaseRow` creates its own `setInterval`.

**Why bad:** N leases = N intervals. All tick at slightly different times due to drift. Memory leak if `clearInterval` is missed. Causes visible timer desync across rows.

**Instead:** Single interval in `LeasePanel`, derived `now` prop passed down.

### Anti-Pattern 2: Data Transformation Inside Chart Components

**What:** Filtering, sorting, or computing derived values inside `ScuAllocationChart`, `CcBalanceChart`, etc.

**Why bad:** Makes charts impossible to test in isolation, couples data logic to visual logic, breaks when data shape changes.

**Instead:** Shape data in `lib/data/mock-*.ts` or in the page before passing as props.

### Anti-Pattern 3: "use client" on Layout or Page Components

**What:** Adding `"use client"` to `app/(dashboard)/layout.tsx` or `app/(dashboard)/page.tsx`.

**Why bad:** Opts the entire component subtree into client-side rendering. Recharts and other client libraries will force their subtrees to be client anyway, but the page itself should remain a Server Component to avoid bundling unnecessary JS.

**Instead:** Keep page/layout as Server Components. Add `"use client"` only to individual chart and timer components.

### Anti-Pattern 4: Inline Mock Data in Components

**What:** Defining `const LEASES = [...]` directly inside `LeasePanel.tsx`.

**Why bad:** Data cannot be reused across pages, hard to find for demo customization, mixes concerns.

**Instead:** Import from `lib/data/mock-leases.ts`.

### Anti-Pattern 5: Dates as Date Objects in Props

**What:** Passing `new Date()` as a prop from Server Component to Client Component.

**Why bad:** `Date` is not serializable across the Server/Client boundary in Next.js — causes hydration errors.

**Instead:** Pass `expiresAt: number` (milliseconds from `Date.getTime()` or `Date.now()`). Convert to display string in the Client Component.

---

## Suggested Build Order

Dependencies are the primary driver. Build foundation before features.

```
1. Types (lib/types/index.ts)
   └── No dependencies. Defines Lease, Asset, Transaction, TimeSeriesPoint.
       Everything else imports from here.

2. Mock Data Modules (lib/data/mock-*.ts)
   └── Depends on: Types
       Everything else imports from here. Define realistic, dramatically
       interesting values for the demo (a lease about to expire, a negative CC balance).

3. Root Layout + Dashboard Shell
   (app/layout.tsx, app/(dashboard)/layout.tsx, DashboardNav, DashboardHeader)
   └── Depends on: Nothing
       Establishes visual frame. Can use placeholder content.

4. Asset Cards (AssetCard, AssetCardGrid)
   └── Depends on: Types, Mock Data
       Static Server Components. Fastest win — shows real data immediately.

5. Urgency Utilities (lib/urgency.ts)
   └── No dependencies on React.
       Needed by LeasePanel before writing any countdown logic.

6. Countdown Timer Infrastructure (LeasePanel, LeaseRow, CountdownTimer)
   └── Depends on: Types, Mock Data, Urgency Utilities
       This is the hardest interactive piece. Build before charts so
       the most complex animation is tested early.

7. Charts — Donut (ScuAllocationChart)
   └── Depends on: Types, Mock Data
       Simplest Recharts chart. Use to validate shadcn chart setup works.

8. Charts — Line/Area (ScuForecastChart, CcBalanceChart)
   └── Depends on: Types, Mock Data, ScuAllocationChart (pattern established)
       More complex due to zero-crossing fill. Build after donut to de-risk.

9. History Table (HistoryTable)
   └── Depends on: Types, Mock Data
       No interactivity needed. Server Component. Quick to build.

10. Send SCU Modal (SendScuModal)
    └── Depends on: Types
        Client Component with form state. Build last — it's scope-optional for demo.

11. Leases Route + History Route (if building separate pages)
    └── Depends on: all of the above
        Reuse existing components, just compose differently.
```

---

## Scalability Considerations

This is a hackathon demo, so scale is not a real concern. Notes are provided for completeness:

| Concern | At Demo scale (1 user, mocked) | At real-product scale |
|---------|-------------------------------|----------------------|
| Timer performance | Single setInterval, negligible | Same pattern holds for <100 leases |
| Data volume | Static mocks, instant load | Switch mock modules for SWR/React Query fetches |
| Chart rendering | Recharts is sufficient | Consider Victory or Nivo for large datasets |
| State management | Props + local useState | Add Zustand if cross-component state becomes complex |
| Auth | Not needed | NextAuth.js is the standard addition |

---

## Sources

- Next.js App Router routing and layout docs: https://nextjs.org/docs/app/getting-started/layouts-and-pages (verified, lastUpdated: 2026-03-20, HIGH confidence)
- shadcn/ui chart components (Recharts wrapper): training data, WebFetch denied — MEDIUM confidence. Pattern is widely used and consistent in community.
- React `useEffect` + `setInterval` timer pattern: training data — HIGH confidence, fundamental React pattern.
- Recharts AreaChart zero-crossing gradient: training data — MEDIUM confidence. Technique is known but implementation details vary.
- Next.js Server vs Client Component boundary decisions: Next.js official docs (routing section confirms file conventions) — HIGH confidence for boundary model, MEDIUM for specific Recharts interactions.
