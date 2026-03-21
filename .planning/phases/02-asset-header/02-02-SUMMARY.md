---
phase: 02-asset-header
plan: 02
subsystem: ui
tags: [nextjs, react, tailwind, typescript, lucide-react, next-link]

# Dependency graph
requires:
  - phase: 02-asset-header
    plan: 01
    provides: "CCCard (debt indicator), SCUCard (abbreviation formatter), shadcn Card, MOCK_PORTFOLIO"
  - phase: 01-foundation
    provides: "Portfolio/CC/SCU types, buttonVariants from button.tsx, cn() utility, (dashboard) layout with DashboardNav"
provides:
  - "ActionRow: three outline navigation buttons (Add/Swap/Transfer) using next/link + buttonVariants"
  - "AssetHeader: container composing CCCard + SCUCard in grid-cols-2 + ActionRow below"
  - "Dashboard page.tsx: renders AssetHeader with MOCK_PORTFOLIO (replaces placeholder)"
  - "Route stubs: /add, /swap, /transfer inside (dashboard) group — inherits DashboardNav"
affects:
  - 03-charts (Phase 3 adds charts below AssetHeader inside the space-y-6 wrapper)
  - 05-actions (Phase 5 replaces route stubs with real Add/Swap/Transfer flows)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Server Component navigation: next/link + buttonVariants — avoids use client for action buttons"
    - "Composing layout via space-y-4 (inner) + space-y-6 (page): inner spacing within AssetHeader, outer wrapper leaves room for Phase 3 charts"
    - "Route stubs inside (dashboard) route group ensure DashboardNav is always visible on /add, /swap, /transfer"

key-files:
  created:
    - frontend/src/components/asset-header/ActionRow.tsx
    - frontend/src/components/asset-header/AssetHeader.tsx
    - frontend/src/app/(dashboard)/add/page.tsx
    - frontend/src/app/(dashboard)/swap/page.tsx
    - frontend/src/app/(dashboard)/transfer/page.tsx
  modified:
    - frontend/src/app/(dashboard)/page.tsx

key-decisions:
  - "ActionRow uses next/link + buttonVariants (not Button asChild) — button.tsx wraps @base-ui/react/button directly with no asChild prop support, confirmed in 02-01-SUMMARY"
  - "Route stubs placed inside (dashboard)/ group — NOT at app/add/ — so they inherit DashboardNav layout automatically"
  - "AssetHeader uses space-y-4 for internal layout; page.tsx uses space-y-6 wrapper leaving room for Phase 3 charts below AssetHeader"

patterns-established:
  - "Navigation button pattern: <Link href={href} className={buttonVariants({ variant: 'outline' })}>icon + label</Link>"
  - "Route group placement: all dashboard routes must live inside (dashboard)/ to inherit nav layout"

requirements-completed: [ASSET-04]

# Metrics
duration: 2min
completed: 2026-03-21
---

# Phase 2 Plan 02: Asset Header Composition Summary

**AssetHeader composing CCCard + SCUCard side-by-side with next/link action buttons (Add/Swap/Transfer), wired to MOCK_PORTFOLIO on dashboard '/', with three route stubs inside the (dashboard) layout group**

## Performance

- **Duration:** ~2 min
- **Started:** 2026-03-21T20:19:09Z
- **Completed:** 2026-03-21T20:20:34Z
- **Tasks:** 2 (+ 1 human-verify checkpoint pending)
- **Files modified:** 6

## Accomplishments
- ActionRow delivers three labeled outline buttons with icons (Plus/ArrowLeftRight/SendHorizontal) as a pure Server Component using next/link + buttonVariants
- AssetHeader composes CCCard + SCUCard in `grid grid-cols-2 gap-4` with ActionRow below in `space-y-4`, all Server Components with no use client boundary
- Dashboard '/' now renders Aria Chen's full asset header: negative CC balance in red (-$1,847), SCU available/total (1.09M / 100M), and three action buttons
- Route stubs at /add, /swap, /transfer created inside `(dashboard)/` so DashboardNav is present on all three — Phase 5 ready
- TypeScript check (`npx tsc --noEmit`) exits 0

## Button asChild Assessment (Outcome)

`button.tsx` (base-nova) uses `@base-ui/react/button` directly — no `asChild` prop. ActionRow uses `next/link` with `buttonVariants({ variant: 'outline' })` className directly on the `<Link>` element. This avoids adding a `"use client"` boundary while producing visually identical button-styled links.

## Task Commits

Each task was committed atomically:

1. **Task 1: Build ActionRow and AssetHeader container** - `6f6b24d` (feat)
2. **Task 2: Wire dashboard page and create route stubs** - `1d52df2` (feat)

## Files Created/Modified
- `frontend/src/components/asset-header/ActionRow.tsx` — Three-button navigation row using next/link + buttonVariants; no use client
- `frontend/src/components/asset-header/AssetHeader.tsx` — Container composing CCCard + SCUCard in grid-cols-2 with ActionRow below; no use client
- `frontend/src/app/(dashboard)/page.tsx` — Dashboard root page; replaced placeholder with `<AssetHeader portfolio={MOCK_PORTFOLIO} />`
- `frontend/src/app/(dashboard)/add/page.tsx` — Route stub for Phase 5 Add flow; inherits DashboardNav
- `frontend/src/app/(dashboard)/swap/page.tsx` — Route stub for Phase 5 Swap flow; inherits DashboardNav
- `frontend/src/app/(dashboard)/transfer/page.tsx` — Route stub for Phase 5 Transfer flow; inherits DashboardNav

## Decisions Made
- Used `next/link` + `buttonVariants` pattern for action buttons (not `Button asChild`) — 02-01-SUMMARY confirmed `button.tsx` does not support asChild
- Route stubs placed inside `(dashboard)/` route group (not top-level `app/`) — ensures DashboardNav layout is inherited automatically
- `AssetHeader` uses `space-y-4` internally; `page.tsx` wraps in `space-y-6` to leave vertical room for Phase 3 charts below

## Deviations from Plan

None — plan executed exactly as written. All acceptance criteria passed on first attempt.

## Issues Encountered

None — button.tsx asChild assessment was pre-resolved in 02-01-SUMMARY. TypeScript check clean on first run.

## Checkpoint: Human Verify (Pending)

Task 3 is a `checkpoint:human-verify`. The user must:
1. Run `cd /Users/derricklim/Documents/GitHub/Quackathon-Seed.BAS/frontend && npm run dev`
2. Visit http://localhost:3000
3. Confirm: two side-by-side cards, CC card shows "-$1,847" in RED, SCU card shows "1.09M / 100M"
4. Confirm: three buttons visible — Add, Swap, Transfer with icons
5. Click each button and confirm navigation within dashboard shell (nav still visible)
6. Confirm: zero browser console errors

## User Setup Required

None — no external service configuration required.

## Next Phase Readiness

- Phase 2 complete: ASSET-01 through ASSET-04 all satisfied
- Phase 3 charts: add components below `<AssetHeader />` inside the `space-y-6` div in `page.tsx`
- Phase 5 actions: replace stub pages at `(dashboard)/add/page.tsx`, `swap/page.tsx`, `transfer/page.tsx`
- All Phase 2 components are pure Server Components — Phase 3 must follow the same pattern unless interactivity required (Recharts needs use client)

## Self-Check: PASSED

All 5 created files confirmed on disk. All 2 task commits (6f6b24d, 1d52df2) confirmed in git log.

---
*Phase: 02-asset-header*
*Completed: 2026-03-21*
