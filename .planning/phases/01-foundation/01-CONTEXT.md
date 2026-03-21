# Phase 1: Foundation - Context

**Gathered:** 2026-03-21
**Status:** Ready for planning

<domain>
## Phase Boundary

Scaffold the Next.js app shell, define TypeScript types for all three asset classes (CAU, SCU, CC) and their relationships, create a staged mock demo script that exercises every urgency state, and establish the shared urgency colour constant system. Nothing user-visible is built here — this phase exists so every subsequent phase has clean foundations to snap into.

</domain>

<decisions>
## Implementation Decisions

### App Location
- Next.js app scaffolded inside `frontend/` directory (already exists in repo)
- Keeps web app separated from any future non-frontend additions

### Route Structure
- Multiple pages via Next.js App Router:
  - `/` — Main dashboard (hero screen: asset cards + charts + leases overview)
  - `/leases` — Full active leases list/detail page
  - `/history` — Full CC transaction history page
- Use App Router route group `(dashboard)` so all three routes share one layout without a URL segment

### Navigation
- Left sidebar navigation — standard banking/fintech pattern
- Links: Dashboard, Leases, History
- Sidebar is a Server Component; individual chart/timer components carry `"use client"`

### Number Scale
- SCU and CAU: millions scale (e.g. 1.1M available / 100M total)
- CC: dollar-formatted in thousands to hundreds of thousands (e.g. $150,100) — matching the sketch

### Urgency Colour System
- Single shared constants file (e.g. `lib/constants/urgency.ts`)
- Three states: healthy (green), warning (yellow), critical (pulsing red)
- Threshold rules: >50% time remaining = healthy, 10–50% = warning, <10% = critical
- No hardcoded hex values anywhere outside this file

### Claude's Discretion
- Mock data narrative/scenario — design a compelling story: recommend a user with mixed state (one critical lease expiring, moderate CC debt, one healthy lease, a batch of recently rented-in SCU) so every urgency state is demonstrable from the first load
- TypeScript strict mode — recommended on
- shadcn initialization details — New York style, zinc base, dark mode default (from research)
- Exact folder structure within `frontend/src/` — follow Next.js App Router conventions

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Project Context
- `.planning/PROJECT.md` — Project vision, asset definitions (CAU/SCU/CC), core value statement
- `.planning/REQUIREMENTS.md` — FOUND-01 through FOUND-04 define exactly what Phase 1 must deliver

### Research
- `.planning/research/STACK.md` — Recommended stack: Next.js 15, shadcn New York style, zinc, dark mode default. Verify Tailwind v3 vs v4 before scaffolding — this is the highest version-risk item.
- `.planning/research/ARCHITECTURE.md` — Component boundaries, Server/Client split, mock data in `lib/data/`, timestamps as `number` (ms) not `Date` objects to avoid hydration errors
- `.planning/research/PITFALLS.md` — setInterval memory leak pattern (single tick, not N intervals), `isAnimationActive={false}` on Recharts

No external specs — requirements fully captured in decisions above.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- None yet — greenfield. `frontend/` directory exists but is empty.

### Established Patterns
- None yet — this phase establishes the patterns all others follow.

### Integration Points
- `frontend/` is where `create-next-app` runs
- Mock data in `frontend/src/lib/data/` — imported by all chart and card components in later phases
- Urgency constants in `frontend/src/lib/constants/urgency.ts` — imported by Lease panel (Phase 4), SCU chart (Phase 3), asset cards (Phase 2)

</code_context>

<specifics>
## Specific Ideas

- The sketch shows CC as `$150,100` — use dollar sign prefix for CC display even though it's compute credits (familiar banking feel)
- The sketch shows SCU as `1.1B / 100B` — we're using millions instead (1.1M / 100M) as decided
- Mock data should be a "demo script" not random data — stage it so a fresh load immediately shows: one pulsing red lease, one yellow lease, one green lease, and a CC balance slightly in the red (debt). This maximises demo impact without needing any interaction.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 01-foundation*
*Context gathered: 2026-03-21*
