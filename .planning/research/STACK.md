# Technology Stack

**Project:** ComputeBank
**Researched:** 2026-03-21
**Confidence note:** Web search and fetch tools unavailable during this session. All findings are from training data (cutoff August 2025) plus ecosystem trajectory reasoning. Versions marked LOW confidence should be verified against npm before install.

---

## Recommended Stack

### Core Framework

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| Next.js | 15.x (App Router) | Full-stack React framework | Stack is locked. App Router is the stable default as of 2024-2025; Pages Router is legacy. Use App Router for RSC support, layouts, and route groups. |
| React | 19.x | UI runtime | Ships with Next.js 15. React 19 stabilised concurrent features and introduced `use()` hook. No reason to pin lower. |
| TypeScript | 5.x | Type safety | Non-negotiable for financial data models — asset states (available/consumed/reserved/leased) need discriminated unions. |
| Tailwind CSS | 3.x | Utility CSS | Ships with shadcn/ui toolchain. v4 was in beta at training cutoff; stay on v3 for stable shadcn compatibility unless you verify v4 is the shadcn default by March 2026. |

**Confidence:** MEDIUM — Next.js 15 and React 19 were current at training cutoff. Verify exact patch versions on npmjs.com before scaffolding.

---

### Visualisation

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| shadcn/ui charts | (via CLI) | Chart components | Stack is locked to Recharts via shadcn. The shadcn chart primitives wrap Recharts with pre-styled, accessible components that match the shadcn design system. Zero friction. |
| Recharts | 2.x | Chart rendering engine | The underlying library behind shadcn charts. Use it directly only when shadcn's chart primitives don't cover a needed chart type (e.g. custom Gantt-style horizontal bars). |

**Chart type mapping for ComputeBank:**

| Visual | shadcn component | Recharts primitive |
|--------|-----------------|-------------------|
| SCU allocation donut | `<ChartContainer>` + `<PieChart>` | `<Pie>` with innerRadius |
| SCU allocation stacked area | `<AreaChart>` | `<Area>` stacked |
| CC balance history (debt line) | `<AreaChart>` | `<Area>` with custom fill below zero |
| SCU depletion forecast | `<LineChart>` | `<Line>` with `<ReferenceLine>` at zero |
| Lease Gantt bars | Custom via `<BarChart>` horizontal layout | `<Bar>` layout="horizontal" |

**Confidence:** HIGH — shadcn chart docs and Recharts 2.x API were stable and well-documented at training cutoff. The Gantt-style view requires custom work; Recharts horizontal bar chart is the closest native primitive.

---

### UI Component Library

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| shadcn/ui | CLI-installed (no version pin — it's copy-paste) | All UI primitives | Stack is locked. shadcn components are not a package dependency — they are CLI-generated source files. This means no version lock-in and full customisability. |

**Key shadcn components for ComputeBank:**

| Component | Use |
|-----------|-----|
| `Card` | Asset overview cards (CAU, SCU, CC balances) |
| `Badge` | Lease state labels (Active / Expiring / Expired) |
| `Table` | Transaction and lease history |
| `Progress` | SCU allocation bar within asset cards |
| `Separator` | Section dividers in dashboard layout |
| `Alert` / `AlertDialog` | Debt state warnings, lease expiry alerts |
| `Tabs` | Switching between Dashboard / History / Leases views |
| `Tooltip` | Chart hover labels |
| `Sheet` | Send/lend SCU side panel flow |
| `Dialog` | Confirmation step in SCU loan initiation |

**Confidence:** HIGH — all listed components are in the shadcn component catalogue as of August 2025.

---

### Animation

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| Framer Motion | 11.x | Pulsing red alert animations, number transitions, panel entrance | The dominant React animation library. v11 introduced a cleaner motion values API and improved performance. For hackathon urgency UI (pulsing lease timers, colour shifts green → yellow → red), Framer Motion's `animate` + `keyframes` + `transition.repeat: Infinity` is the fastest authoring path. |
| CSS `@keyframes` via Tailwind | — | Simpler pulsing (ring, opacity) | Tailwind's `animate-pulse` and custom `@keyframes` in `globals.css` handle the outer ring glow effect without JS overhead. Use for anything that is purely visual and doesn't need JS-driven state transitions. |

**Decision rule:**
- Use **Framer Motion** when animation responds to data state changes (e.g., timer < 5 min → trigger pulse, number counter ticking down).
- Use **Tailwind CSS animations** when animation is unconditional and purely decorative (e.g., background pulse ring on an already-red card).

**Do NOT use:**
- `react-spring` — more complex API, less community documentation for this pattern, no benefit over Framer Motion for this project scope.
- GSAP — overkill, license cost for commercial use, not idiomatic in React/Next.js ecosystem.
- CSS transitions alone — cannot handle JS-driven state-reactive animation needed for timer urgency states.

**Confidence:** MEDIUM — Framer Motion 11.x was released and stable at training cutoff. Verify current version on npm. The API approach described is stable across v10-v11.

---

### State Management and Countdown Timers

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| React `useState` + `useEffect` + `setInterval` | (built-in) | Countdown timer logic | No external state library needed. Each lease timer is an isolated countdown: `useEffect` sets a 1-second interval that decrements remaining seconds, `useState` holds the value, and the component re-renders on tick. Clean up with `clearInterval` on unmount. |
| React Context | (built-in) | Global mocked data store | A single `DataContext` wraps the app and provides asset balances, lease list, and transaction history. No Zustand or Redux needed — mocked data is static after initialization, only timer state is dynamic. |

**Do NOT use:**
- Zustand / Jotai / Redux — unnecessary complexity for a mocked single-user dashboard. The app has no async data fetching, no optimistic updates, no server state. Global state is the mocked dataset — React Context is sufficient.
- React Query / SWR — these solve server-state caching; there is no server. Importing them adds dead weight.
- `date-fns` or `dayjs` for timer display — overkill. A simple utility function `formatCountdown(seconds: number): string` is three lines and covers `HH:MM:SS` display.

**Countdown timer pattern:**

```typescript
// hooks/useCountdown.ts
import { useState, useEffect } from 'react'

export function useCountdown(initialSeconds: number) {
  const [secondsLeft, setSecondsLeft] = useState(initialSeconds)

  useEffect(() => {
    if (secondsLeft <= 0) return
    const interval = setInterval(() => {
      setSecondsLeft(prev => Math.max(0, prev - 1))
    }, 1000)
    return () => clearInterval(interval)
  }, [secondsLeft])

  return secondsLeft
}
```

Urgency threshold logic lives in a pure function, not the hook:

```typescript
export type UrgencyLevel = 'safe' | 'warning' | 'critical' | 'expired'

export function getUrgency(secondsLeft: number, totalSeconds: number): UrgencyLevel {
  if (secondsLeft <= 0) return 'expired'
  const ratio = secondsLeft / totalSeconds
  if (ratio < 0.1) return 'critical'   // pulsing red
  if (ratio < 0.25) return 'warning'   // yellow
  return 'safe'                         // green
}
```

**Confidence:** HIGH — this is standard React pattern, not subject to library version churn.

---

### Mocked Data Strategy

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| TypeScript constant files | — | Static asset and lease data | No faker.js, no MSW, no API mocking. For a hackathon demo with a fixed "impressive" scenario, hardcoded TypeScript data in `lib/mock-data.ts` is fastest to write, easiest to tweak for demo polish, and zero runtime overhead. |
| `crypto.randomUUID()` | (browser built-in) | Lease and transaction IDs | No `uuid` package needed. Available in all modern browsers and Node 18+. |

**Mock data structure:**

```typescript
// lib/mock-data.ts

export const MOCK_USER: User = {
  id: 'usr_01',
  name: 'Aria Chen',
  cau: 42.5,         // Compute Asset Units (hardware equivalent)
  scu: 8340,         // Standard Compute Units (spendable flow)
  cc: -1240,         // Compute Credits (negative = debt state)
}

export const MOCK_LEASES: Lease[] = [
  {
    id: 'lease_01',
    counterparty: 'NovaTech Corp',
    scuAmount: 500,
    startedAt: Date.now() - 3600 * 2 * 1000,   // 2 hours ago
    expiresAt: Date.now() + 60 * 8 * 1000,      // 8 minutes from now → CRITICAL
    direction: 'outbound',
  },
  // ...more leases with varied urgency levels for demo impact
]
```

**Demo data design principle:** Stage the mock data to tell a story — one lease in critical state (< 10% time left), one in warning, two safe. CC balance is negative to trigger debt UI. SCU is partially depleted (not full, not empty) to show the allocation chart meaningfully. This maximises visual coverage in a hackathon demo.

**Do NOT use:**
- `faker.js` / `@faker-js/faker` — overkill for a fixed demo scenario. Random data is unpredictable and may accidentally produce an unimpressive state (all leases safe, no debt).
- MSW (Mock Service Worker) — designed for mocking API endpoints. There are no API endpoints to mock.
- JSON files loaded via `fetch` — adds async complexity for no benefit over a static TS import.

**Confidence:** HIGH — this is a design decision, not a library question.

---

### Utility Libraries

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `clsx` + `tailwind-merge` | (ships with shadcn) | Conditional class merging | Already installed by shadcn CLI. Use `cn()` utility (the shadcn convention) throughout. |
| `lucide-react` | Latest | Icons | Ships with shadcn. Use for status icons (TrendingDown for debt, Clock for timers, AlertTriangle for urgency). |
| `next-themes` | 0.x | Dark mode | shadcn scaffolds this. ComputeBank should default to dark mode — financial terminal aesthetic suits the compute-currency theme. |

**Do NOT add:**
- `lodash` — not needed. Utility operations on the mock data (sorting leases by expiry, summing SCU states) are simple enough to write inline.
- `axios` — no HTTP requests.
- `zod` — useful for form validation in the Send/Lend flow, but given hackathon scope and mocked data, optional. Add it only if form validation complexity warrants it.

**Confidence:** HIGH — these are shadcn default dependencies.

---

## Alternatives Considered

| Category | Recommended | Alternative | Why Not |
|----------|-------------|-------------|---------|
| Charts | Recharts (via shadcn) | Nivo | Project constraint specifies Recharts. Also: Nivo has heavier bundle. |
| Charts | Recharts (via shadcn) | Victory | Same constraint. Victory API is less intuitive for financial chart patterns. |
| Charts | Recharts (via shadcn) | D3.js | D3 is 10x the authoring complexity for the same output at hackathon speed. |
| Animation | Framer Motion | react-spring | Framer Motion has better DX for keyframe-driven urgency loops. |
| Animation | Framer Motion | CSS only | Can't react to JS timer state changes cleanly. |
| State | React Context | Zustand | No async state, no cross-cutting derived state. Context is sufficient. |
| Mocking | Static TS | MSW | No API surface to mock. |
| Icons | lucide-react | heroicons | lucide-react ships with shadcn. No reason to add a second icon set. |

---

## Installation

```bash
# Scaffold Next.js with TypeScript and Tailwind
npx create-next-app@latest computebank \
  --typescript \
  --tailwind \
  --app \
  --src-dir \
  --import-alias "@/*"

cd computebank

# Init shadcn/ui (follow prompts — select New York style, zinc base color)
npx shadcn@latest init

# Add shadcn components
npx shadcn@latest add card badge table progress separator alert tabs tooltip sheet dialog

# Add shadcn chart support (installs Recharts as a peer dep)
npx shadcn@latest add chart

# Add Framer Motion
npm install framer-motion

# Add next-themes (dark mode)
npm install next-themes
```

**NOTE on Tailwind version:** Before running `create-next-app`, verify whether shadcn's `init` command in March 2026 defaults to Tailwind v3 or v4. If v4, the `globals.css` configuration syntax changes. Check the shadcn docs at https://ui.shadcn.com/docs/installation/next before scaffolding.

**NOTE on shadcn style:** New York style uses slightly tighter spacing than Default — better for a data-dense dashboard. Zinc base color reads as neutral/terminal without being pure grey.

---

## Sources

- Training data (cutoff August 2025) — confidence MEDIUM unless marked HIGH
- Project constraint: `.planning/PROJECT.md` specifies Next.js + shadcn/ui + Recharts — no deviation
- shadcn/ui documentation structure: https://ui.shadcn.com/docs (verify current before scaffolding)
- Recharts documentation: https://recharts.org/en-US/ (verify Recharts version that ships with shadcn chart in March 2026)
- Framer Motion: https://www.framer.com/motion/ (verify v11.x is still current)
- Next.js: https://nextjs.org/blog (verify latest stable — likely 15.x as of March 2026)

**Verification priority before first commit:**
1. Run `npx create-next-app@latest --version` to confirm Next.js version
2. Check `npx shadcn@latest init` output for Tailwind version it installs
3. After `npx shadcn@latest add chart`, check `package.json` for exact Recharts version
