# Phase 2: Asset Header - Research

**Researched:** 2026-03-21
**Domain:** Next.js 16 App Router, shadcn v4 Card, Tailwind v4, conditional styling
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Card anatomy**
- Large bold number dominates the card (primary metric)
- Small muted label sits below the number (e.g. "Total CC Balance", "Available SCU")
- Small lucide-react icon in the top-right corner: `DollarSign` for CC card, `Cpu` for SCU card
- Both cards are equal size and equal visual weight — no hierarchy implied between CC and SCU

**Card shell**
- Use shadcn `Card` component (rounded-xl, border-border, dark background)
- Subtle border — standard shadcn card appearance
- No frosted glass, no heavy background fill — numbers-first, minimal

**Number formatting**
- CC: dollar sign + comma-formatted integer (e.g. `$150,100` or `-$1,847`) — no abbreviation
- SCU: abbreviated millions with one decimal (e.g. `1.09M / 100M`) — already decided in Phase 1
- Negative CC shows a leading minus sign (`-$1,847`) — no parentheses notation

**Header layout**
- CC card and SCU card sit side by side in the same row
- Action button row (Add / Swap / Transfer) sits below the cards as a second row
- No user name or greeting — cards speak for themselves
- Header section fills the full content column width (not constrained to a narrower container)

**Action buttons**
- Style: `icon + label`, ghost/outline variant from shadcn Button
- Icon left of label — `Plus` for Add, `ArrowLeftRight` for Swap, `SendHorizontal` for Transfer (all lucide-react)
- Phase 2 behaviour: each button navigates to its respective route stub (`/add`, `/swap`, `/transfer`)
- Create the three empty page stubs now so Phase 5 has routing in place to fill in

**CC debt indicator**
- When `cc.balance < 0`: balance number uses `URGENCY_TEXT_COLORS.critical` (red text) AND card gets `border-red-500/40` border
- No additional badge, no label change — the negative sign combined with red colour is the full signal
- When `cc.balance >= 0`: normal card border (`border-border`), normal number colour (`text-foreground`)
- Import `URGENCY_TEXT_COLORS` from `@/lib/constants/urgency` — no hardcoded hex values

### Claude's Discretion
- Exact padding and spacing within cards
- Precise font sizes for number vs label
- Whether to use `cn()` for conditional border class or inline style
- Order of action buttons (Add / Swap / Transfer — or reorder based on visual rhythm)

### Deferred Ideas (OUT OF SCOPE)
None — discussion stayed within phase scope.
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| ASSET-01 | Dashboard header shows Total CC balance card (e.g. "$150,100") in Revolut-style format | Intl.NumberFormat + Card component pattern; data from MOCK_PORTFOLIO.cc.balance |
| ASSET-02 | Dashboard header shows Total SCU card with available/total format (e.g. "1.1B / 100B") | Abbreviation formatter utility (M suffix); data from MOCK_PORTFOLIO.scu.available + scu.total |
| ASSET-03 | CC card highlights in red when balance is negative (debt state) | URGENCY_TEXT_COLORS.critical + border-red-500/40 via cn(); data already in MOCK_PORTFOLIO (balance: -1847) |
| ASSET-04 | Action button row below cards: Add, Swap, Transfer — each navigates to its respective flow | shadcn Button (outline variant) + next/link; three empty page stubs inside (dashboard) route group |
</phase_requirements>

---

## Summary

Phase 2 builds the dashboard header: two side-by-side asset balance cards (CC and SCU) plus a three-button action row (Add, Swap, Transfer) below them. The entire surface is pure display and navigation — no data fetching, no timers, no charts. All data flows from the already-created `MOCK_PORTFOLIO` constant imported at the top of `page.tsx`.

The Card component is NOT yet installed into the project (`frontend/src/components/ui/` currently only contains `button.tsx` and `separator.tsx`). It must be scaffolded via `npx shadcn@latest add card` before implementation begins. The project uses shadcn v4.1.0 with the `base-nova` style, meaning the installed Card will use `@base-ui/react` primitives, consistent with the existing Button component.

Navigation for action buttons uses Next.js `<Link>` component wrapping shadcn `Button` — this avoids needing `"use client"` on the card components and keeps the header as a Server Component. Three route stubs (`/add`, `/swap`, `/transfer`) must be created inside the `(dashboard)` route group so they inherit the dashboard layout.

**Primary recommendation:** Scaffold the Card component first, build `AssetHeader` as a Server Component that accepts `Portfolio` as a prop, keep CC/SCU cards as separate subcomponents, and use `next/link` for button navigation to avoid unnecessary client-side boundary promotion.

---

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Next.js | 16.2.1 | App Router, file-based routing, Server Components | Already installed; route stubs follow (dashboard) group convention |
| shadcn/ui | 4.1.0 | Card, Button UI primitives | Project standard; base-nova style already configured |
| Tailwind CSS | ^4 | Utility-first styling, CSS variable-driven dark mode | Already configured in globals.css |
| lucide-react | ^0.577.0 | Icons (DollarSign, Cpu, Plus, ArrowLeftRight, SendHorizontal) | Already installed, used in DashboardNav |
| clsx + tailwind-merge | ^2.1.1 / ^3.5.0 | Conditional class composition via cn() | Already in @/lib/utils |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| @base-ui/react | ^1.3.0 | Base UI primitives (Button already uses this) | Underlying primitive for shadcn components in base-nova style |
| URGENCY_TEXT_COLORS | project | Red text token for debt indicator | Import from @/lib/constants/urgency — never hardcode |
| MOCK_PORTFOLIO | project | Demo data source | Import from @/lib/data/mock-portfolio |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| next/link wrapping Button | useRouter + onClick | Link is simpler, keeps component as Server Component (no "use client" needed) |
| cn() for conditional border | Inline style | cn() preferred per project conventions; inline style only if Tailwind class purging is an issue |
| Intl.NumberFormat | Manual string replace | Intl.NumberFormat is locale-aware and handles edge cases; never hand-roll currency formatting |

**Installation (Card component — not yet installed):**
```bash
cd /Users/derricklim/Documents/GitHub/Quackathon-Seed.BAS/frontend && npx shadcn@latest add card
```

No other new dependencies are needed.

---

## Architecture Patterns

### Recommended Project Structure
```
frontend/src/
├── app/
│   └── (dashboard)/
│       ├── layout.tsx          # Existing — unchanged
│       ├── page.tsx            # Replace placeholder with <AssetHeader>
│       ├── add/
│       │   └── page.tsx        # NEW — empty stub for Phase 5
│       ├── swap/
│       │   └── page.tsx        # NEW — empty stub for Phase 5
│       └── transfer/
│           └── page.tsx        # NEW — empty stub for Phase 5
└── components/
    ├── ui/
    │   ├── button.tsx          # Existing
    │   ├── card.tsx            # NEW — scaffolded via npx shadcn add card
    │   └── separator.tsx       # Existing
    └── asset-header/
        ├── AssetHeader.tsx     # NEW — container: two cards + action row
        ├── CCCard.tsx          # NEW — CC balance card with debt indicator
        └── SCUCard.tsx         # NEW — SCU available/total card
```

### Pattern 1: Server Component Composition

**What:** `AssetHeader` is a Server Component that receives `Portfolio` as a prop from `page.tsx`. No `"use client"` on AssetHeader, CCCard, or SCUCard. Navigation buttons use `next/link` which works in Server Components.

**When to use:** Any time the component only reads props and renders — no event handlers, no state, no browser APIs.

```tsx
// frontend/src/components/asset-header/AssetHeader.tsx
// Source: Next.js 16 docs — server-and-client-components
import { CCCard } from './CCCard'
import { SCUCard } from './SCUCard'
import { ActionRow } from './ActionRow'
import type { Portfolio } from '@/types'

export function AssetHeader({ portfolio }: { portfolio: Portfolio }) {
  return (
    <section className="space-y-4 w-full">
      <div className="grid grid-cols-2 gap-4">
        <CCCard cc={portfolio.cc} />
        <SCUCard scu={portfolio.scu} />
      </div>
      <ActionRow />
    </section>
  )
}
```

```tsx
// frontend/src/app/(dashboard)/page.tsx
import { AssetHeader } from '@/components/asset-header/AssetHeader'
import { MOCK_PORTFOLIO } from '@/lib/data/mock-portfolio'

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <AssetHeader portfolio={MOCK_PORTFOLIO} />
    </div>
  )
}
```

### Pattern 2: CC Debt Indicator via cn()

**What:** The CC card conditionally applies red text colour and red border when `cc.balance < 0`. Use `cn()` to compose the conditional classes — single source of truth for the debt state logic.

**When to use:** Any UI element that switches visual state based on a boolean condition derived from data.

```tsx
// frontend/src/components/asset-header/CCCard.tsx
// Source: urgency.ts + CONTEXT.md locked decisions
import { Card, CardContent } from '@/components/ui/card'
import { DollarSign } from 'lucide-react'
import { cn } from '@/lib/utils'
import { URGENCY_TEXT_COLORS } from '@/lib/constants/urgency'
import type { CC } from '@/types'

function formatCC(balance: number): string {
  const abs = Math.abs(balance)
  const formatted = new Intl.NumberFormat('en-US').format(abs)
  return balance < 0 ? `-$${formatted}` : `$${formatted}`
}

export function CCCard({ cc }: { cc: CC }) {
  const isDebt = cc.balance < 0

  return (
    <Card className={cn(
      'relative',
      isDebt ? 'border-red-500/40' : 'border-border'
    )}>
      <CardContent className="pt-6">
        <div className="flex items-start justify-between">
          <div>
            <p className={cn(
              'text-3xl font-bold tracking-tight',
              isDebt ? URGENCY_TEXT_COLORS.critical : 'text-foreground'
            )}>
              {formatCC(cc.balance)}
            </p>
            <p className="text-sm text-muted-foreground mt-1">Total CC Balance</p>
          </div>
          <DollarSign className="w-5 h-5 text-muted-foreground" />
        </div>
      </CardContent>
    </Card>
  )
}
```

### Pattern 3: SCU Abbreviation Formatter

**What:** SCU available and total values are large numbers (1_087_340 / 100_000_000). Format them with M suffix and one decimal, e.g. `1.09M / 100M`. The available value is visually dominant; total is muted.

**When to use:** Whenever displaying large SCU numbers in constrained card space.

```tsx
// Utility function — can live inline in SCUCard.tsx or in a shared formatters file
function formatSCU(value: number): string {
  if (value >= 1_000_000_000) {
    return `${(value / 1_000_000_000).toFixed(1)}B`
  }
  if (value >= 1_000_000) {
    return `${(value / 1_000_000).toFixed(2)}M`
  }
  if (value >= 1_000) {
    return `${(value / 1_000).toFixed(1)}K`
  }
  return value.toString()
}
```

Note: `MOCK_PORTFOLIO.scu.available = 1_087_340` formats to `1.09M`. `MOCK_PORTFOLIO.scu.total = 100_000_000` formats to `100.00M` — trim trailing zeros: `100M`.

### Pattern 4: Action Buttons via next/link

**What:** Each action button is a shadcn `Button` (outline variant) wrapped in a `next/link`. This pattern requires no `"use client"` directive — Link works in Server Components.

**When to use:** Navigation-only buttons. If click handlers or state are needed, switch to `"use client"`.

```tsx
// frontend/src/components/asset-header/ActionRow.tsx
// Source: Next.js 16 link.md docs
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Plus, ArrowLeftRight, SendHorizontal } from 'lucide-react'

const ACTIONS = [
  { href: '/add',      label: 'Add',      Icon: Plus },
  { href: '/swap',     label: 'Swap',     Icon: ArrowLeftRight },
  { href: '/transfer', label: 'Transfer', Icon: SendHorizontal },
] as const

export function ActionRow() {
  return (
    <div className="flex gap-3">
      {ACTIONS.map(({ href, label, Icon }) => (
        <Button key={href} variant="outline" asChild>
          <Link href={href}>
            <Icon />
            {label}
          </Link>
        </Button>
      ))}
    </div>
  )
}
```

### Pattern 5: Route Stubs for Phase 5

**What:** Three empty page stubs inside the `(dashboard)` route group. They inherit the dashboard layout automatically.

**When to use:** Whenever a route needs to exist now but its content is deferred.

```tsx
// frontend/src/app/(dashboard)/add/page.tsx
// (same pattern for swap/page.tsx and transfer/page.tsx)
export default function AddPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-foreground">Add</h1>
      <p className="text-muted-foreground mt-2">Coming in Phase 5.</p>
    </div>
  )
}
```

### Anti-Patterns to Avoid

- **"use client" on AssetHeader:** Unnecessary — no state, no events. Adding it forces the whole subtree onto the client bundle.
- **Hardcoded hex colours:** Never use `color: '#ef4444'` — always use `URGENCY_TEXT_COLORS.critical` or Tailwind classes.
- **Raw Tailwind colour classes where CSS vars exist:** Use `text-foreground` not `text-white`; `border-border` not `border-neutral-800/20`.
- **Placing route stubs outside (dashboard) group:** `/add`, `/swap`, `/transfer` must sit inside `(dashboard)/` to inherit the nav layout.
- **Using Button's onClick for navigation:** Requires "use client" — use `next/link` + `asChild` instead.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Number formatting | Custom regex/replace for commas | `Intl.NumberFormat('en-US')` | Handles locale edge cases, sign, zero values correctly |
| Card container | `<div>` with manual border/radius/padding | shadcn `Card` + `CardContent` | Consistent with design system; automatically picks up CSS variable tokens |
| Conditional class composition | String concatenation | `cn()` from @/lib/utils | Deduplicates Tailwind classes, handles undefined, integrates with twMerge |
| Client routing | `window.location.href` | `next/link` | Enables prefetching, client-side transitions, correct Next.js routing |

**Key insight:** The Card and Button primitives from shadcn handle all the visual complexity (border-radius tokens, dark mode vars, focus states) — custom `<div>` implementations will drift from the design system immediately.

---

## Common Pitfalls

### Pitfall 1: Card Component Not Installed
**What goes wrong:** Importing `@/components/ui/card` throws a module-not-found error at build time.
**Why it happens:** Only `button.tsx` and `separator.tsx` exist in `components/ui/` — Card was never added.
**How to avoid:** Run `npx shadcn@latest add card` inside `frontend/` as the very first task of this phase.
**Warning signs:** Import error on `@/components/ui/card` at dev server start.

### Pitfall 2: Adding "use client" to AssetHeader Unnecessarily
**What goes wrong:** The entire AssetHeader subtree (CCCard, SCUCard, ActionRow) becomes a Client Component bundle, eliminating the Server Component benefit.
**Why it happens:** Developers default to "use client" when unsure.
**How to avoid:** Only mark a component "use client" if it uses state, effects, event handlers, or browser APIs. Navigation via `next/link` does NOT require "use client".
**Warning signs:** If you find yourself writing `"use client"` and there's no `useState`, `useEffect`, or `onClick` — reconsider.

### Pitfall 3: Route Stubs Outside the (dashboard) Route Group
**What goes wrong:** `/add`, `/swap`, `/transfer` pages render without the DashboardNav sidebar — blank shell layout.
**Why it happens:** Creating `app/add/page.tsx` instead of `app/(dashboard)/add/page.tsx`.
**How to avoid:** All dashboard routes must be children of `app/(dashboard)/`. The parentheses in `(dashboard)` are a route group — they don't appear in the URL but they DO scope the shared layout.
**Warning signs:** Nav bar disappears when navigating to the action routes.

### Pitfall 4: SCU Format Shows Too Many Decimals
**What goes wrong:** `1_087_340 / 1_000_000` = `1.08734` — ugly and confusing.
**Why it happens:** Using raw division without `toFixed()`.
**How to avoid:** Always apply `.toFixed(2)` then strip trailing zeros for M/B suffixes. For the total (100M) show no decimal if it's a whole number.
**Warning signs:** Number displays 6+ decimal places in dev.

### Pitfall 5: Hardcoding Border Colour Instead of Using Constants
**What goes wrong:** `border-red-500` instead of `border-red-500/40` — full opacity border is too harsh; inconsistent with the muted urgency aesthetic.
**Why it happens:** Copying URGENCY_CLASSES border string rather than reading CONTEXT.md.
**How to avoid:** CONTEXT.md explicitly specifies `border-red-500/40` for the debt state. Use exactly this class.
**Warning signs:** CC card in debt state has a visually jarring bright red border.

---

## Code Examples

Verified patterns from project source and official docs:

### CC Number Formatter (no hand-rolling)
```typescript
// Source: MDN Intl.NumberFormat + CONTEXT.md locked decision (no abbreviation, leading minus)
function formatCC(balance: number): string {
  const abs = Math.abs(balance)
  const formatted = new Intl.NumberFormat('en-US').format(abs)
  return balance < 0 ? `-$${formatted}` : `$${formatted}`
}

// Test cases:
// formatCC(-1847)    → "-$1,847"
// formatCC(150100)   → "$150,100"
// formatCC(0)        → "$0"
```

### SCU Abbreviation Formatter
```typescript
// Source: CONTEXT.md (1.09M / 100M format)
function formatSCU(value: number): string {
  if (value >= 1_000_000_000) {
    return (value / 1_000_000_000).toFixed(1).replace(/\.0$/, '') + 'B'
  }
  if (value >= 1_000_000) {
    return (value / 1_000_000).toFixed(2).replace(/\.?0+$/, '') + 'M'
  }
  if (value >= 1_000) {
    return (value / 1_000).toFixed(1).replace(/\.0$/, '') + 'K'
  }
  return value.toLocaleString()
}

// Test cases with MOCK_PORTFOLIO data:
// formatSCU(1_087_340)    → "1.09M"
// formatSCU(100_000_000)  → "100M"
```

### Conditional cn() for Debt State
```typescript
// Source: cn() from @/lib/utils, URGENCY_TEXT_COLORS from @/lib/constants/urgency
// CONTEXT.md: border-red-500/40, URGENCY_TEXT_COLORS.critical for text
import { cn } from '@/lib/utils'
import { URGENCY_TEXT_COLORS } from '@/lib/constants/urgency'

const isDebt = cc.balance < 0

// Card border:
className={cn('relative', isDebt ? 'border-red-500/40' : 'border-border')}

// Number text colour:
className={cn(
  'text-3xl font-bold tracking-tight',
  isDebt ? URGENCY_TEXT_COLORS.critical : 'text-foreground'
)}
// URGENCY_TEXT_COLORS.critical === 'text-red-500' (confirmed in urgency.ts)
```

### next/link + Button asChild Pattern
```tsx
// Source: Next.js 16 link.md + shadcn Button asChild pattern
// No "use client" required — works in Server Components
import Link from 'next/link'
import { Button } from '@/components/ui/button'

<Button variant="outline" asChild>
  <Link href="/add">
    <Plus />
    Add
  </Link>
</Button>
```

### shadcn Card Usage (after npx shadcn add card)
```tsx
// Source: shadcn v4 Card component API
import { Card, CardContent } from '@/components/ui/card'

<Card>
  <CardContent className="pt-6">
    {/* content */}
  </CardContent>
</Card>
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `useRouter().push()` for nav buttons | `next/link` + Button `asChild` | Next.js App Router era | No "use client" needed for navigation |
| Direct class concatenation | `cn()` via clsx + tailwind-merge | shadcn adoption | Correct deduplication of conflicting Tailwind utilities |
| `Date` objects for timestamps | `number` (ms epoch) | Phase 1 decision | Prevents Next.js Server/Client hydration errors |

**Deprecated/outdated:**
- `pages/` router patterns: This project uses App Router exclusively — no `getServerSideProps`, no `getStaticProps`.
- `next/router` (pages router): Use `next/link` and `next/navigation` only.

---

## Open Questions

1. **Does shadcn v4 Card use `asChild` or its own compound primitives in base-nova style?**
   - What we know: The existing `button.tsx` wraps `@base-ui/react/button` — base-nova style uses Base UI primitives. However, Card is a simpler layout component that may be pure HTML divs with Tailwind classes.
   - What's unclear: The exact generated `card.tsx` content won't be known until `npx shadcn add card` runs.
   - Recommendation: Run `npx shadcn add card` as Task 1, read the generated file, then implement CCCard and SCUCard referencing the actual available exports (likely `Card`, `CardContent`, `CardHeader`, `CardTitle`).

2. **Does Button support `asChild` in base-nova style?**
   - What we know: Standard shadcn Button supports `asChild` via Radix slot. The base-nova Button uses `@base-ui/react/button` which extends `ButtonPrimitive.Props`.
   - What's unclear: Whether `@base-ui/react/button` supports the `asChild` prop pattern for `next/link` wrapping.
   - Recommendation: If `asChild` is not available, use `Link` directly with `className={buttonVariants({ variant: 'outline' })}` instead.

3. **SCU display label — "Available SCU" or "SCU" with available/total sub-display?**
   - What we know: CONTEXT.md says "available / total" format (e.g. `1.09M / 100M`), with available highlighted and total muted/smaller.
   - What's unclear: Whether the card label is "Available SCU" or "SCU" with a split display showing available prominently and total smaller.
   - Recommendation: Available figure is primary (large bold), total is secondary (smaller, muted), label below reads "Available SCU". This aligns with the CONTEXT.md "available is highlighted" instruction.

---

## Sources

### Primary (HIGH confidence)
- `/Users/derricklim/Documents/GitHub/Quackathon-Seed.BAS/frontend/src/types/index.ts` — Portfolio, CC, SCU type shapes confirmed
- `/Users/derricklim/Documents/GitHub/Quackathon-Seed.BAS/frontend/src/lib/constants/urgency.ts` — URGENCY_TEXT_COLORS.critical = 'text-red-500' confirmed
- `/Users/derricklim/Documents/GitHub/Quackathon-Seed.BAS/frontend/src/lib/data/mock-portfolio.ts` — MOCK_PORTFOLIO.cc.balance = -1847, scu.available = 1_087_340, scu.total = 100_000_000 confirmed
- `/Users/derricklim/Documents/GitHub/Quackathon-Seed.BAS/frontend/node_modules/next/dist/docs/01-app/03-api-reference/02-components/link.md` — next/link props and Server Component compatibility confirmed
- `/Users/derricklim/Documents/GitHub/Quackathon-Seed.BAS/frontend/node_modules/next/dist/docs/01-app/01-getting-started/05-server-and-client-components.md` — "use client" decision criteria confirmed
- `/Users/derricklim/Documents/GitHub/Quackathon-Seed.BAS/frontend/node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/route-groups.md` — (dashboard) route group scope confirmed
- `/Users/derricklim/Documents/GitHub/Quackathon-Seed.BAS/frontend/src/components/ui/button.tsx` — base-nova Button API confirmed (variant, size props)
- `/Users/derricklim/Documents/GitHub/Quackathon-Seed.BAS/frontend/package.json` — lucide-react 0.577.0 installed confirmed
- `/Users/derricklim/Documents/GitHub/Quackathon-Seed.BAS/.planning/phases/02-asset-header/02-CONTEXT.md` — All locked decisions

### Secondary (MEDIUM confidence)
- shadcn v4 Card component API (WebFetch from ui.shadcn.com/docs/components/card) — Card, CardHeader, CardContent, CardAction structure confirmed; exact base-nova style output unknown until scaffolded

### Tertiary (LOW confidence)
- `asChild` support on base-nova Button: Not directly verified — base-nova uses `@base-ui/react/button` which may handle slot differently from Radix. Fallback pattern documented above.

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all dependencies confirmed installed and versions verified from package.json
- Architecture: HIGH — Server Component pattern, route group behaviour, cn() usage all verified from Next.js 16 official docs
- Pitfalls: HIGH — Card not installed verified by directory scan; route group scope verified from docs
- Number formatting: HIGH — formatCC logic verified against CONTEXT.md locked decisions and MOCK_PORTFOLIO data values
- Button asChild: MEDIUM — standard shadcn pattern, but base-nova style uses different primitives; fallback documented

**Research date:** 2026-03-21
**Valid until:** 2026-04-20 (stable stack — Next.js 16, shadcn 4.1.0, Tailwind 4 unlikely to have breaking changes in 30 days)
