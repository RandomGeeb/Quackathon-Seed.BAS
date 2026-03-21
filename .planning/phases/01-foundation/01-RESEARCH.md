# Phase 1: Foundation - Research

**Researched:** 2026-03-21
**Domain:** Next.js 16 App Router scaffold, TypeScript types, mock data design, urgency constants
**Confidence:** HIGH (core stack verified against live official docs; architecture patterns verified via existing project research docs)

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

- **App Location:** Next.js app scaffolded inside `frontend/` directory (already exists in repo). Keeps web app separated from any future non-frontend additions.
- **Route Structure:** Multiple pages via Next.js App Router:
  - `/` — Main dashboard (hero screen: asset cards + charts + leases overview)
  - `/leases` — Full active leases list/detail page
  - `/history` — Full CC transaction history page
  - Use App Router route group `(dashboard)` so all three routes share one layout without a URL segment
- **Navigation:** Left sidebar navigation — standard banking/fintech pattern. Links: Dashboard, Leases, History. Sidebar is a Server Component; individual chart/timer components carry `"use client"`.
- **Number Scale:** SCU and CAU: millions scale (e.g. 1.1M available / 100M total). CC: dollar-formatted in thousands to hundreds of thousands (e.g. $150,100) — matching the sketch.
- **Urgency Colour System:** Single shared constants file (`lib/constants/urgency.ts`). Three states: healthy (green), warning (yellow), critical (pulsing red). Threshold rules: >50% time remaining = healthy, 10–50% = warning, <10% = critical. No hardcoded hex values anywhere outside this file.

### Claude's Discretion

- Mock data narrative/scenario — design a compelling story: recommend a user with mixed state (one critical lease expiring, moderate CC debt, one healthy lease, a batch of recently rented-in SCU) so every urgency state is demonstrable from the first load.
- TypeScript strict mode — recommended on.
- shadcn initialization details — New York style, zinc base, dark mode default (from research).
- Exact folder structure within `frontend/src/` — follow Next.js App Router conventions.

### Deferred Ideas (OUT OF SCOPE)

None — discussion stayed within phase scope.
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| FOUND-01 | App has Next.js App Router shell with navigation between Dashboard, Leases, and History pages | Next.js 16 App Router with `(dashboard)` route group; sidebar as Server Component |
| FOUND-02 | TypeScript types defined for CAU, SCU, CC, Lease, and Transaction data shapes | TypeScript 5.x strict mode; discriminated unions for urgency states; all types in `types/index.ts` |
| FOUND-03 | Mocked data is a staged demo script with all urgency states represented (healthy, warning, critical, debt) | Static TS in `lib/data/`; `Date.now()` arithmetic; no faker.js needed |
| FOUND-04 | Shared urgency colour constants (green → yellow → pulsing red) used consistently across all components | Single `lib/constants/urgency.ts`; Tailwind class map; threshold functions |
</phase_requirements>

---

## Summary

Phase 1 is a pure scaffolding and foundation-laying phase. Nothing visually complex is built, but every decision made here ripples through all five subsequent phases. The two highest-risk items are the version landscape and the mock data design.

**Version landscape has shifted significantly since prior research.** Next.js is now at 16.2.1 (not 15.x as the prior STACK.md assumed), and shadcn/ui now defaults to Tailwind CSS v4 (not v3). Tailwind v4 replaces `tailwind.config.js` with CSS-first `@theme` configuration and replaces the three `@tailwind` directives with a single `@import "tailwindcss"`. The core App Router patterns remain unchanged and all existing architecture research still applies.

**Mock data is a product asset, not a placeholder.** The staged demo scenario must be designed as a narrative — one pulsing-red lease, one yellow lease, one green lease, and a negative CC balance — so that every urgency state is visible on first load with no interaction required. Irregular, non-round numbers make the demo feel real.

**Primary recommendation:** Run `npx create-next-app@latest` inside the `frontend/` directory with TypeScript, Tailwind, App Router, and `src/` directory enabled; then run `npx shadcn@latest init -t next` to set up Tailwind v4 + shadcn with New York style and zinc base color. Do not add Framer Motion or chart components in this phase — they are Phase 3+ concerns.

---

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Next.js | 16.2.1 | App Router framework | Current stable. Turbopack is now the default bundler. App Router is the default. |
| React | 19.2 | UI runtime | Ships with Next.js 16. Concurrent features stable. |
| TypeScript | 5.x | Type safety | Non-negotiable for financial data models with multiple asset classes and urgency states. |
| Tailwind CSS | 4.x | Utility CSS | Ships with `create-next-app` and is the current shadcn default. CSS-first config via `@theme`. |
| shadcn/ui | CLI (no version pin) | UI component primitives | Stack is locked. Source-copied components with full customisability. New York style + zinc. |

### Supporting (Phase 1 only — install now for later phases)

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `next-themes` | latest | Dark mode provider | Install at scaffold time. ComputeBank defaults to dark mode; no toggle needed. |
| `lucide-react` | latest | Icons | Ships with shadcn. Used for sidebar nav icons (LayoutDashboard, Layers, History). |
| `clsx` + `tailwind-merge` | ships with shadcn | Conditional class merging via `cn()` | Used in every component for conditional urgency classes. |

### Do NOT install in Phase 1

| Library | Reason to Defer |
|---------|-----------------|
| `framer-motion` | Phase 3+ concern — urgency animations are not Phase 1 scope |
| Recharts / shadcn chart | Phase 3 concern — no charts are built in Phase 1 |
| `zod` | Phase 5 concern — form validation for action flows |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Tailwind v4 (default) | Tailwind v3 (explicit pin) | v3 is still supported but is legacy for new projects in 2026. Starting on v3 means an unnecessary migration later. Start on v4. |
| Static TS mock data | `faker.js` | Random data is unpredictable — may produce unimpressive demo states. Static curated data is faster and more reliable for a hackathon. |
| `Date.now()` as `number` | `Date` objects | `Date` objects are not serializable across the Next.js Server/Client boundary — causes hydration errors. Always use `number` (ms epoch). |

### Installation

```bash
# Run inside the repo root — app goes into frontend/
npx create-next-app@latest frontend \
  --typescript \
  --tailwind \
  --app \
  --src-dir \
  --import-alias "@/*" \
  --yes

cd frontend

# Init shadcn/ui — select: New York style, zinc base color
npx shadcn@latest init -t next

# Add next-themes for dark mode
npm install next-themes

# Add shadcn primitives needed in Phase 1 shell only
# (sidebar nav, page layouts)
npx shadcn@latest add separator
```

**NOTE:** `--yes` on `create-next-app` accepts defaults (TypeScript, ESLint, Tailwind, App Router, Turbopack, `@/*` alias). Verify the generated `globals.css` contains `@import "tailwindcss"` — this is the Tailwind v4 syntax. If it contains `@tailwind base/components/utilities`, the project defaulted to v3.

---

## Architecture Patterns

### Recommended Project Structure

```
frontend/src/
├── app/
│   ├── layout.tsx                  # Root layout (ThemeProvider, fonts)
│   ├── globals.css                 # @import "tailwindcss" + custom @theme
│   └── (dashboard)/                # Route group — no URL segment
│       ├── layout.tsx              # Dashboard shell (sidebar + header)
│       ├── page.tsx                # / route — main dashboard
│       ├── leases/
│       │   └── page.tsx            # /leases route
│       └── history/
│           └── page.tsx            # /history route
├── components/
│   ├── ui/                         # shadcn primitives (auto-generated, do not edit)
│   └── layout/
│       ├── DashboardNav.tsx        # Left sidebar — Server Component
│       └── DashboardHeader.tsx     # Top header bar — Server Component
├── lib/
│   ├── constants/
│   │   └── urgency.ts              # SINGLE SOURCE of urgency colours + thresholds
│   └── data/
│       ├── mock-portfolio.ts       # CAU, SCU, CC balances
│       ├── mock-leases.ts          # Active leases with expiry timestamps
│       └── mock-history.ts         # CC transaction history rows
└── types/
    └── index.ts                    # All shared TypeScript interfaces
```

**Note on `(dashboard)` route group:** The parentheses in `(dashboard)` are a Next.js App Router convention — the folder name is omitted from the URL. All three pages share the dashboard layout without a `/dashboard/` prefix in the URL.

### Pattern 1: TypeScript Types in `types/index.ts`

**What:** All domain types defined once, imported everywhere. No inline type declarations in component files.

**When to use:** Always. This is the first thing to create in Phase 1.

```typescript
// Source: project architecture decision, types/index.ts

// Urgency level — drives colour system
export type UrgencyLevel = 'healthy' | 'warning' | 'critical' | 'expired'

// Compute Asset Unit — the underlying hardware asset
export interface CAU {
  id: string
  totalUnits: number           // e.g. 100_000_000 (100M)
  productionRatePerHour: number // SCU generated per hour
}

// Standard Compute Unit — the spendable flow
export interface SCU {
  available: number            // e.g. 1_100_000 (1.1M)
  consumed: number
  reserved: number
  leasedOut: number
  total: number                // CAU.totalUnits × production rate
}

// Compute Credits — the liquid currency (can go negative)
export interface CC {
  balance: number              // negative = debt state
}

// An active lease of SCU to/from another party
export interface Lease {
  id: string
  counterparty: string
  scuAmount: number
  scuPerHour: number
  direction: 'outbound' | 'inbound'
  startedAt: number            // ms epoch — NOT Date object (hydration safety)
  expiresAt: number            // ms epoch — NOT Date object
}

// A CC transaction event
export interface Transaction {
  id: string
  counterparty: string
  amount: number               // positive = received, negative = sent/charged
  direction: 'in' | 'out'
  timestamp: number            // ms epoch
  description: string
}

// The complete portfolio snapshot for the mocked user
export interface Portfolio {
  userId: string
  userName: string
  cau: CAU
  scu: SCU
  cc: CC
}
```

### Pattern 2: Urgency Constants — Single Source of Truth

**What:** All urgency colours, Tailwind classes, and threshold rules live exclusively in `lib/constants/urgency.ts`. Zero hardcoded hex values or colour strings anywhere else in the codebase.

**When to use:** This file is created in Phase 1 and imported by Phase 2, 3, and 4 components.

```typescript
// Source: CONTEXT.md locked decision
// frontend/src/lib/constants/urgency.ts

import type { UrgencyLevel } from '@/types'

// Threshold rules (percentage of total lease duration remaining)
export const URGENCY_THRESHOLDS = {
  healthy: 0.5,   // > 50% remaining → healthy (green)
  warning: 0.1,   // 10–50% remaining → warning (yellow)
  // < 10% remaining → critical (pulsing red)
} as const

// Tailwind class map — import this in components, never hardcode colours
export const URGENCY_CLASSES: Record<UrgencyLevel, string> = {
  healthy:  'text-green-500  bg-green-500/10  border-green-500/20',
  warning:  'text-yellow-400 bg-yellow-400/10 border-yellow-400/20',
  critical: 'text-red-500    bg-red-500/10    border-red-500/20 animate-urgency-pulse',
  expired:  'text-neutral-500 bg-neutral-500/10 border-neutral-500/20',
}

// Bar fill classes for Gantt bars (background only, no text/border)
export const URGENCY_BAR_CLASSES: Record<UrgencyLevel, string> = {
  healthy:  'bg-green-500',
  warning:  'bg-yellow-400',
  critical: 'bg-red-500 animate-urgency-pulse',
  expired:  'bg-neutral-600',
}

// Pure derivation function — given ms remaining and ms total, return urgency level
export function getUrgencyLevel(msRemaining: number, msTotal: number): UrgencyLevel {
  if (msRemaining <= 0) return 'expired'
  const ratio = msRemaining / msTotal
  if (ratio < URGENCY_THRESHOLDS.warning) return 'critical'
  if (ratio < URGENCY_THRESHOLDS.healthy) return 'warning'
  return 'healthy'
}
```

**Critical rule:** The `animate-urgency-pulse` Tailwind class must be defined in `globals.css` as a custom `@keyframes` animation — do NOT use Tailwind's built-in `animate-pulse` (which pulses opacity, not background color).

```css
/* globals.css — add to @theme or after the @import */
@keyframes urgency-pulse {
  0%, 100% { opacity: 1; }
  50%       { opacity: 0.6; }
}
.animate-urgency-pulse {
  animation: urgency-pulse 1s ease-in-out infinite;
}
```

### Pattern 3: Mock Data as Demo Script

**What:** All mock data is hardcoded TypeScript constants in `lib/data/`. Relative timestamps computed from `Date.now()` at module load time so the demo is always "live" at any launch time.

**When to use:** All three mock data files are created in Phase 1.

```typescript
// Source: architecture decision, lib/data/mock-leases.ts
import type { Lease } from '@/types'

const NOW = Date.now()
const MIN = 60_000
const HOUR = 3_600_000

export const MOCK_LEASES: Lease[] = [
  {
    // CRITICAL: < 10% time remaining — pulsing red
    id: 'lease-001',
    counterparty: 'NovaTech Systems',
    scuAmount: 340_000,
    scuPerHour: 42_500,
    direction: 'outbound',
    startedAt: NOW - 8 * HOUR,
    expiresAt: NOW + 4 * MIN,   // 4 minutes left out of ~8 hours → ~0.8% remaining
  },
  {
    // WARNING: 10–50% time remaining — yellow
    id: 'lease-002',
    counterparty: 'Cluster-Omega',
    scuAmount: 180_000,
    scuPerHour: 18_000,
    direction: 'outbound',
    startedAt: NOW - 4 * HOUR,
    expiresAt: NOW + 1.7 * HOUR, // ~1h42m left out of ~5.7h → ~30% remaining
  },
  {
    // HEALTHY: > 50% time remaining — green
    id: 'lease-003',
    counterparty: 'Arch-Node-7',
    scuAmount: 820_000,
    scuPerHour: 82_000,
    direction: 'inbound',
    startedAt: NOW - 2 * HOUR,
    expiresAt: NOW + 6.4 * HOUR, // ~6h24m left out of ~8.4h → ~76% remaining
  },
]
```

```typescript
// lib/data/mock-portfolio.ts
import type { Portfolio } from '@/types'

export const MOCK_PORTFOLIO: Portfolio = {
  userId: 'usr_aria_chen',
  userName: 'Aria Chen',
  cau: {
    id: 'cau-001',
    totalUnits: 100_000_000,        // 100M CAU
    productionRatePerHour: 4_320,   // SCU/hr production rate
  },
  scu: {
    available:  1_087_340,          // ~1.1M — partially depleted, not empty
    consumed:   342_810,
    reserved:   210_000,
    leasedOut:  1_340_000,          // sum of outbound leases
    total:      100_000_000,        // 100M total
  },
  cc: {
    balance: -1_847,                // NEGATIVE — debt state visible on first load
  },
}
```

### Pattern 4: Server/Client Component Split

**What:** Sidebar, header, and all static display components are Server Components. Only components that use timers (`setInterval`), Recharts, or form state need `"use client"`.

**When to use:** Phase 1 shell components (sidebar, layouts) are all Server Components. Client components are introduced in Phase 3+.

```typescript
// app/(dashboard)/layout.tsx — Server Component, no "use client"
import { DashboardNav } from '@/components/layout/DashboardNav'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-screen">
      <DashboardNav />
      <main className="flex-1 p-6">{children}</main>
    </div>
  )
}
```

```typescript
// components/layout/DashboardNav.tsx — Server Component
import Link from 'next/link'
import { LayoutDashboard, Layers, History } from 'lucide-react'

const NAV_ITEMS = [
  { href: '/',        label: 'Dashboard', icon: LayoutDashboard },
  { href: '/leases',  label: 'Leases',    icon: Layers },
  { href: '/history', label: 'History',   icon: History },
]

export function DashboardNav() {
  return (
    <nav className="w-56 border-r border-border flex flex-col gap-1 p-4">
      {NAV_ITEMS.map(({ href, label, icon: Icon }) => (
        <Link key={href} href={href}
          className="flex items-center gap-3 px-3 py-2 rounded-md text-sm text-muted-foreground hover:text-foreground hover:bg-accent transition-colors">
          <Icon className="w-4 h-4" />
          {label}
        </Link>
      ))}
    </nav>
  )
}
```

### Anti-Patterns to Avoid

- **Hardcoded hex values in components:** Any `color: "#ef4444"` or `bg-[#22c55e]` outside `lib/constants/urgency.ts` violates FOUND-04. Use the class map.
- **`Date` objects as props:** `new Date()` passed from Server to Client Component causes hydration errors. Always use `number` (ms epoch via `Date.now()` or `.getTime()`).
- **`"use client"` on layout or page files:** Phase 1 creates the shell — everything stays as Server Components. `"use client"` is introduced only when adding Recharts charts (Phase 3) and timer components (Phase 4).
- **Mock data defined inline in components:** All mock data must live in `lib/data/`. Components import from there.
- **Round numbers in mock data:** `SCU: 1000000` looks fake. Use irregular values like `1_087_340`.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Conditional class merging | Custom string concat logic | `cn()` from shadcn (`clsx` + `tailwind-merge`) | Ships with shadcn; handles Tailwind class conflicts correctly |
| Dark mode toggling | Custom `useState` theme switcher | `next-themes` `ThemeProvider` | Handles SSR flash, system preference, persistence |
| Icon system | SVG files or custom icon components | `lucide-react` | Ships with shadcn; tree-shakes; consistent with shadcn components |
| Timestamp formatting | Custom date/time utilities | Inline `new Intl.DateTimeFormat()` | Three lines, no dependency, sufficient for mock display |
| UUID generation | Custom ID generator | `crypto.randomUUID()` | Browser built-in, available Node 18+, no package needed |

**Key insight:** Every "hand-roll" temptation in this phase is solved by something that ships with shadcn or is a browser built-in. Add zero new dependencies in Phase 1 beyond what `create-next-app` and `shadcn init` provide.

---

## Common Pitfalls

### Pitfall 1: Tailwind v4 CSS Syntax Mismatch

**What goes wrong:** Developer writes Tailwind v3 syntax in `globals.css` (`@tailwind base; @tailwind components; @tailwind utilities;`) after scaffolding a v4 project. Build fails or produces no styles.

**Why it happens:** Prior research documents in this project referenced v3 syntax. Next.js 16 + shadcn now default to v4.

**How to avoid:** After `create-next-app`, verify `globals.css` contains `@import "tailwindcss"` (v4 syntax). If it contains the three `@tailwind` directives, the install defaulted to v3 — check if shadcn's `init` changed it.

**Warning signs:** No styles rendered in browser, or `Unknown at rule @tailwind` lint error.

### Pitfall 2: `tailwind.config.js` Doesn't Exist in v4

**What goes wrong:** Developer creates `tailwind.config.js` expecting to configure theme extensions (custom colors for urgency, custom animations) but the file is ignored in Tailwind v4.

**Why it happens:** Tailwind v4 moved all configuration into CSS via the `@theme` directive. The JS config file is not used by default.

**How to avoid:** Add custom urgency animation and any theme extensions directly in `globals.css`:

```css
/* globals.css */
@import "tailwindcss";

@theme {
  /* Custom animation for pulsing critical state */
  --animate-urgency-pulse: urgency-pulse 1s ease-in-out infinite;
}

@keyframes urgency-pulse {
  0%, 100% { opacity: 1; }
  50%       { opacity: 0.6; }
}
```

**Warning signs:** Custom Tailwind classes defined in config file don't appear; `tailwind.config.js` edits have no effect.

### Pitfall 3: Next.js 16 Async Params Breaking Change

**What goes wrong:** If any page uses `params` or `searchParams` synchronously (e.g., `{ params }: { params: { id: string } }`), Next.js 16 throws a runtime error because these are now Promise-based.

**Why it happens:** Next.js 16 removed synchronous access to request APIs. This is a breaking change from 15.x.

**How to avoid:** Phase 1 pages don't have dynamic segments, so this is not immediately an issue. But be aware for Phase 5 (action flows). Pattern when needed:

```typescript
// Next.js 16 — params must be awaited
export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  // ...
}
```

**Warning signs:** Runtime error "params should be awaited before accessing properties."

### Pitfall 4: Mock Data With Round Numbers

**What goes wrong:** Stakeholders (hackathon judges) immediately see `SCU: 1,000,000` and read the dashboard as a skeleton prototype, not a product. The urgency narrative collapses.

**Why it happens:** Developers treat mock data as a technical placeholder.

**How to avoid:** Use irregular values. Stagger timestamps with slight irregularity. Include all urgency states from the first load. Design the scenario as a curated story (see the mock data code examples above).

**Warning signs:** Any number in mock data that is evenly divisible by 100,000.

### Pitfall 5: Urgency Thresholds Inconsistent With CONTEXT.md Decision

**What goes wrong:** Developer codes threshold logic as `< 1 hour = warning` (matching existing STACK.md code sample) rather than `< 50% time remaining = warning` (matching the locked CONTEXT.md decision).

**Why it happens:** Multiple threshold values appear in the existing research docs — STACK.md has `yellow: 3600` (1 hour absolute), but CONTEXT.md locked a percentage-based rule.

**How to avoid:** Use the CONTEXT.md rule (percentage-based): >50% = healthy, 10–50% = warning, <10% = critical. The `getUrgencyLevel(msRemaining, msTotal)` function in `lib/constants/urgency.ts` must take both values as arguments.

**Warning signs:** Timer shows yellow immediately on a lease that just started, or red too early/late.

---

## Code Examples

Verified patterns from official sources and project research:

### `globals.css` for Tailwind v4

```css
/* Source: tailwindcss.com/docs/guides/nextjs (verified 2026-03-21) */
@import "tailwindcss";

/* Custom urgency pulse animation — NOT Tailwind's animate-pulse */
@keyframes urgency-pulse {
  0%, 100% { opacity: 1; }
  50%       { opacity: 0.6; }
}

@theme {
  --animate-urgency-pulse: urgency-pulse 1s ease-in-out infinite;
}
```

### Root Layout With Dark Mode Default

```typescript
// Source: next-themes docs, shadcn dark mode pattern
// app/layout.tsx
import { ThemeProvider } from 'next-themes'
import './globals.css'

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
          {children}
        </ThemeProvider>
      </body>
    </html>
  )
}
```

**Note:** `suppressHydrationWarning` on `<html>` prevents the hydration warning that `next-themes` generates when applying the theme class server-side vs client-side.

### Dashboard Route Group Layout

```typescript
// app/(dashboard)/layout.tsx — Server Component
import { DashboardNav } from '@/components/layout/DashboardNav'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-background">
      <DashboardNav />
      <div className="flex-1 flex flex-col">
        <main className="flex-1 p-6 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  )
}
```

### `types/index.ts` Timestamp Convention

```typescript
// All timestamps as number (ms epoch) — NEVER Date objects
// Reason: Date objects are not serializable across Next.js Server/Client boundary
export interface Lease {
  id: string
  counterparty: string
  scuAmount: number
  scuPerHour: number
  direction: 'outbound' | 'inbound'
  startedAt: number    // Date.now() or date.getTime()
  expiresAt: number    // Date.now() or date.getTime()
}
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `@tailwind base/components/utilities` in globals.css | `@import "tailwindcss"` | Tailwind v4 (2025) | Single import replaces three directives |
| `tailwind.config.js` for theme extensions | `@theme {}` block in CSS | Tailwind v4 (2025) | JS config file is not used; all extensions in CSS |
| Next.js 15 with Webpack | Next.js 16 with Turbopack (default) | Oct 2025 | No config change needed; custom webpack configs are ignored |
| Sync `params` in page components | `async params: Promise<{...}>` and `await params` | Next.js 16 (Oct 2025) | Breaking change — pages with dynamic segments must await params |
| `middleware.ts` | `proxy.ts` (deprecated but still works) | Next.js 16 | Rename recommended but not urgent for this project |

**Deprecated/outdated in existing project research docs:**

- `STACK.md` references Next.js 15.x and Tailwind v3 — superseded. Use Next.js 16 and Tailwind v4.
- `STACK.md` installation command uses `create-next-app` flags that still work but the simplified `--yes` flag now accepts all recommended defaults automatically.
- `STACK.md` urgency threshold example uses absolute seconds (`yellow: 3600`) — superseded by CONTEXT.md's percentage-based rule (10%/50%).

---

## Open Questions

1. **shadcn `init` style prompt behaviour in v4**
   - What we know: shadcn's CLI now defaults to New York style (per web search: "new-york as the default style"). Zinc base color is still available.
   - What's unclear: Whether the interactive prompt still asks for style/color, or whether New York/zinc is now always the default requiring no selection.
   - Recommendation: Run `npx shadcn@latest init -t next` and observe the prompts. If no style prompt appears, New York is already the default — no action needed.

2. **Tailwind v4 `cn()` utility compatibility**
   - What we know: shadcn's `cn()` utility uses `clsx` + `tailwind-merge`. Tailwind-merge needs to understand v4 class names to merge correctly.
   - What's unclear: Whether `tailwind-merge` has been updated to handle v4 class patterns at the version shadcn installs.
   - Recommendation: After `shadcn init`, test `cn('bg-red-500', 'bg-green-500')` returns `'bg-green-500'` (merge works). If it returns both classes, `tailwind-merge` may need a manual update: `npm install tailwind-merge@latest`.

3. **`next-themes` compatibility with Next.js 16**
   - What we know: `next-themes` is widely used with Next.js and works with App Router.
   - What's unclear: Whether the `suppressHydrationWarning` approach still resolves the hydration warning in Next.js 16.
   - Recommendation: Install `next-themes`, add `suppressHydrationWarning` to `<html>`, and verify no hydration error in browser console on first dev load.

---

## Sources

### Primary (HIGH confidence)

- Next.js official installation docs — https://nextjs.org/docs/app/getting-started/installation (verified 2026-03-21, version 16.2.1)
- Next.js 16 release blog — https://nextjs.org/blog/next-16 (published Oct 2025, verified 2026-03-21)
- Tailwind CSS official Next.js guide — https://tailwindcss.com/docs/guides/nextjs (verified 2026-03-21, v4 syntax confirmed)
- shadcn/ui Tailwind v4 docs — https://ui.shadcn.com/docs/tailwind-v4 (verified 2026-03-21)
- `.planning/research/ARCHITECTURE.md` — Component boundaries, Server/Client split, mock data patterns (project research, HIGH for architectural decisions)
- `.planning/research/PITFALLS.md` — setInterval memory leaks, Recharts re-render, mock data design (project research, HIGH for listed patterns)

### Secondary (MEDIUM confidence)

- Web search: shadcn/ui Tailwind v4 default — confirmed by multiple sources including shadcn GitHub discussions
- Web search: Next.js 16 breaking changes — confirmed async params requirement via official upgrade guide URL

### Tertiary (LOW confidence)

- `tailwind-merge` v4 compatibility — inferred from ecosystem trajectory; not directly verified against tailwind-merge changelog
- `next-themes` Next.js 16 compatibility — no direct official statement found; assumed compatible based on no breaking reports in search results

---

## Metadata

**Confidence breakdown:**

- Standard stack (versions): HIGH — verified against live Next.js and Tailwind official docs
- Architecture patterns: HIGH — verified against official Next.js App Router docs and consistent with existing project research
- Tailwind v4 configuration: HIGH — verified against official Tailwind docs
- Mock data design: HIGH — design decision, not library-dependent
- Open questions: LOW — edge cases flagged for validation at scaffold time

**Research date:** 2026-03-21
**Valid until:** 2026-06-21 (90 days — Next.js major versions release slowly; Tailwind v4 is now stable)
