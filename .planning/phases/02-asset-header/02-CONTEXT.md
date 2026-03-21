# Phase 2: Asset Header - Context

**Gathered:** 2026-03-21
**Status:** Ready for planning

<domain>
## Phase Boundary

Build the dashboard header section: two asset balance cards (CC and SCU) and a three-button quick-action row (Add, Swap, Transfer). This is what every user sees immediately on load — it communicates financial position at a glance. No charts, no lease panels — header only. Action flows themselves are Phase 5.

</domain>

<decisions>
## Implementation Decisions

### Card anatomy
- Large bold number dominates the card (primary metric)
- Small muted label sits below the number (e.g. "Total CC Balance", "Available SCU")
- Small lucide-react icon in the top-right corner: `DollarSign` for CC card, `Cpu` for SCU card
- Both cards are equal size and equal visual weight — no hierarchy implied between CC and SCU

### Card shell
- Use shadcn `Card` component (rounded-xl, border-border, dark background)
- Subtle border — standard shadcn card appearance
- No frosted glass, no heavy background fill — numbers-first, minimal

### Number formatting
- CC: dollar sign + comma-formatted integer (e.g. `$150,100` or `-$1,847`) — **no abbreviation**
- SCU: abbreviated millions with one decimal (e.g. `1.09M / 100M`) — **already decided in Phase 1**
- Negative CC shows a leading minus sign (`-$1,847`) — no parentheses notation

### Header layout
- CC card and SCU card sit **side by side** in the same row
- Action button row (Add / Swap / Transfer) sits **below** the cards as a second row
- No user name or greeting — cards speak for themselves
- Header section fills the full content column width (not constrained to a narrower container)

### Action buttons
- Style: `icon + label`, ghost/outline variant from shadcn Button
- Icon left of label — `Plus` for Add, `ArrowLeftRight` for Swap, `SendHorizontal` for Transfer (all lucide-react)
- Phase 2 behaviour: each button **navigates to its respective route stub** (`/add`, `/swap`, `/transfer`)
- Create the three empty page stubs now so Phase 5 has routing in place to fill in

### CC debt indicator
- When `cc.balance < 0`: balance number uses `URGENCY_TEXT_COLORS.critical` (red text) AND card gets `border-red-500/40` border
- No additional badge, no label change — the negative sign combined with red colour is the full signal
- When `cc.balance >= 0`: normal card border (`border-border`), normal number colour (`text-foreground`)
- Import `URGENCY_TEXT_COLORS` from `@/lib/constants/urgency` — no hardcoded hex values

### Claude's Discretion
- Exact padding and spacing within cards
- Precise font sizes for number vs label
- Whether to use `cn()` for conditional border class or inline style
- Order of action buttons (Add / Swap / Transfer — or reorder based on visual rhythm)

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Project context
- `.planning/REQUIREMENTS.md` — ASSET-01 through ASSET-04 define Phase 2 deliverables
- `.planning/PROJECT.md` — Core value, asset definitions (CC = Compute Credits, SCU = Standard Compute Units)

### Existing implementation (Phase 1)
- `frontend/src/types/index.ts` — `Portfolio`, `CC`, `SCU`, `CAU` type definitions; all timestamps as `number` (ms epoch)
- `frontend/src/lib/constants/urgency.ts` — `URGENCY_TEXT_COLORS` (use for debt indicator red text), `URGENCY_CLASSES` (available for future urgency states)
- `frontend/src/lib/data/mock-portfolio.ts` — `MOCK_PORTFOLIO` (Aria Chen, CC: -1847, SCU: 1_087_340/100M) — the data source for this phase
- `frontend/src/app/(dashboard)/layout.tsx` — Dashboard shell; new components plug into `children`
- `frontend/src/app/(dashboard)/page.tsx` — The dashboard page stub this phase fills in

### Tooling
- `frontend/CLAUDE.md` / `frontend/AGENTS.md` — Project-specific agent rules: read `node_modules/next/dist/docs/` before writing any Next.js code

No external design specs — all requirements fully captured in decisions above.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `shadcn Card` component — installed, available via `@/components/ui/card`. Use `Card`, `CardHeader`, `CardContent` primitives directly.
- `URGENCY_TEXT_COLORS` from `@/lib/constants/urgency` — use `URGENCY_TEXT_COLORS.critical` for red number text in debt state
- `lucide-react` — already installed (used in `DashboardNav`). Import `DollarSign`, `Cpu`, `Plus`, `ArrowLeftRight`, `SendHorizontal`
- `cn()` from `@/lib/utils` — available for conditional class composition

### Established Patterns
- Server Components by default; only add `"use client"` if interactive (action buttons need `"use client"` for navigation)
- Dark mode via Tailwind CSS variables (`bg-background`, `text-foreground`, `text-muted-foreground`, `border-border`) — never use raw Tailwind colour classes where CSS vars exist
- No hardcoded hex values — always import from urgency constants

### Integration Points
- `frontend/src/app/(dashboard)/page.tsx` — Replace the placeholder with the `AssetHeader` component
- `/add`, `/swap`, `/transfer` routes — Create as empty page stubs inside `frontend/src/app/(dashboard)/`
- `MOCK_PORTFOLIO` data flows directly into component props; no data-fetching layer needed in Phase 2

</code_context>

<specifics>
## Specific Ideas

- "Revolut-style" for CC card: large number first, muted label below, clean card with subtle border — the Phase 1 CONTEXT sketch reference confirms this feel
- SCU card shows `available / total` — e.g. `1.09M / 100M` where available is highlighted and total is muted/smaller

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 02-asset-header*
*Context gathered: 2026-03-21*
