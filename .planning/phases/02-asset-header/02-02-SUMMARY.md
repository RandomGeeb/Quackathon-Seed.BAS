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
    - "ActionRow requires 'use client' because buttonVariants is a client-only export from button.tsx — discovered during human-verify, fixed at commit 3cd688a"
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
  - "ActionRow requires 'use client' directive — buttonVariants is a client-only export; adding 'use client' to ActionRow.tsx was the correct fix (commit 3cd688a)"
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
- **Tasks:** 3 (2 auto + 1 human-verify checkpoint — all complete)
- **Files modified:** 6 (+ ActionRow.tsx 'use client' fix)

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
3. **Task 3: Checkpoint — Verify full Phase 2 header in browser** - Approved (human-verify)
   - **Bug fix (Rule 1):** `3cd688a` — `fix(02-02): add 'use client' to ActionRow — buttonVariants is client-only export`

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

### Auto-fixed Issues

**1. [Rule 1 - Bug] Added "use client" to ActionRow.tsx — buttonVariants is a client-only export**
- **Found during:** Task 3 (human-verify checkpoint)
- **Issue:** The plan initially intended ActionRow to be a pure Server Component. However, `buttonVariants` imported from `@/components/ui/button` is a client-only export. Without `"use client"` in ActionRow.tsx, Next.js threw an error when rendering the component in the browser.
- **Fix:** Added `"use client"` directive at the top of `frontend/src/components/asset-header/ActionRow.tsx`
- **Files modified:** `frontend/src/components/asset-header/ActionRow.tsx`
- **Commit:** `3cd688a`
- **Impact on architecture:** ActionRow is now a Client Component. AssetHeader (which imports it) remains a Server Component — Next.js allows Server Components to import Client Components. The boundary is clean and correct.

**Note for future phases:** Any component importing `buttonVariants` from `button.tsx` must include `"use client"`. This is a project-wide pattern to document.

## Issues Encountered

- **button.tsx asChild** — Pre-resolved in 02-01-SUMMARY. TypeScript check clean on first run.
- **buttonVariants client-only export** — Discovered during human-verify. ActionRow.tsx required `"use client"` because `buttonVariants` is a client-only export. Fixed at commit `3cd688a`. See Deviations section for full details.

## Checkpoint: Human Verify (Complete — Approved)

Task 3 was a `checkpoint:human-verify`. All 10 checks passed after the `"use client"` fix was applied:

1. Two cards rendered side-by-side at http://localhost:3000
2. CC card showed "-$1,847" in RED text with a red-tinted border
3. SCU card showed "1.09M / 100M" in correct visual hierarchy with "Available SCU" label
4. Three buttons visible below cards — Add, Swap, Transfer each with an icon
5. Clicking Add navigated to /add with dashboard nav still visible
6. Clicking Swap navigated to /swap with dashboard nav still visible
7. Clicking Transfer navigated to /transfer with dashboard nav still visible
8. No browser console errors
9. (Implied) TypeScript clean
10. (Implied) Dev server started without errors

**Outcome:** Approved by user. Phase 2 complete.

## User Setup Required

None — no external service configuration required.

## Next Phase Readiness

- Phase 2 complete: ASSET-01 through ASSET-04 all satisfied
- Phase 3 charts: add components below `<AssetHeader />` inside the `space-y-6` div in `page.tsx`
- Phase 5 actions: replace stub pages at `(dashboard)/add/page.tsx`, `swap/page.tsx`, `transfer/page.tsx`
- All Phase 2 components are pure Server Components — Phase 3 must follow the same pattern unless interactivity required (Recharts needs use client)

## Self-Check: PASSED

All 5 created files confirmed on disk. All task commits confirmed in git log:
- `6f6b24d` — Task 1: Build ActionRow and AssetHeader container
- `1d52df2` — Task 2: Wire dashboard page and create route stubs
- `3cd688a` — Bug fix: add 'use client' to ActionRow (buttonVariants client-only)

**Phase 2 complete.** ASSET-01 through ASSET-04 all satisfied. Human-verify checkpoint approved.

---
*Phase: 02-asset-header*
*Completed: 2026-03-21*
