---
phase: 01-foundation
plan: 03
subsystem: ui
tags: [mock-data, typescript, nextjs, recharts]

# Dependency graph
requires:
  - phase: 01-foundation plan 02
    provides: TypeScript domain types (Portfolio, Lease, Transaction, CAU, SCU, CC) and urgency constants
provides:
  - MOCK_PORTFOLIO — Aria Chen portfolio snapshot with -1847 CC debt balance and irregular SCU values
  - MOCK_LEASES — Three active leases covering critical (NovaTech <1%), warning (Cluster-Omega 30%), healthy/inbound (Arch-Node-7 76%) urgency states
  - MOCK_HISTORY — 8 CC transactions (4 in, 4 out) with irregular amounts narrating -1847 net balance
  - MOCK_SCU_HISTORY — 23 time-series data points over 8-hour window with V-dip narrative; final value matches portfolio
  - SCU_DataPoint interface for Phase 3 Recharts chart
affects:
  - Phase 2 (asset cards will import MOCK_PORTFOLIO directly)
  - Phase 3 (history panel imports MOCK_HISTORY; SCU Activity Monitor imports MOCK_SCU_HISTORY)
  - Phase 4 (lease panel imports MOCK_LEASES; CC card imports MOCK_PORTFOLIO.cc.balance)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - Mock data as demo script — curated scenario (Aria Chen) with specific narrative visible within 5 seconds of first load
    - Date.now() arithmetic for always-live timestamps — no hardcoded ms values
    - Irregular values (1_087_340 not 1_000_000) to simulate real telemetry
    - SCU_DataPoint kept in mock-history.ts (not types/index.ts) as chart-specific, non-domain type

key-files:
  created:
    - frontend/src/lib/data/mock-portfolio.ts
    - frontend/src/lib/data/mock-leases.ts
    - frontend/src/lib/data/mock-history.ts
  modified: []

key-decisions:
  - "SCU_DataPoint interface lives in mock-history.ts rather than types/index.ts — it is chart-specific and not a domain entity; Phase 3 imports from the data file"
  - "cauThreshold in MOCK_SCU_HISTORY set to 500_000 for chart scale visibility, not the raw 4320/hr rate"
  - "MOCK_HISTORY ordered newest-first to match Phase 3 Revolut-style list rendering expectation"

patterns-established:
  - "Pattern 1: Mock data as product asset — each file has a narrative comment explaining the story judges will see"
  - "Pattern 2: NOW constant at module level — all timestamps are NOW +/- arithmetic, never hardcoded epoch values"
  - "Pattern 3: Numeric separators (1_087_340) for all large numbers throughout mock data"

requirements-completed: [FOUND-03]

# Metrics
duration: 2min
completed: 2026-03-21
---

# Phase 1 Plan 3: Mock Demo Data Summary

**Three typed mock data files covering all urgency states, debt CC balance, and V-dip SCU history for always-live demo scenario**

## Performance

- **Duration:** 2 min
- **Started:** 2026-03-21T19:40:29Z
- **Completed:** 2026-03-21T19:42:19Z
- **Tasks:** 2
- **Files modified:** 3

## Accomplishments
- Created `MOCK_PORTFOLIO` for Aria Chen with 100M CAU, -$1,847 CC debt balance, and 1_087_340 irregular available SCU
- Created `MOCK_LEASES` with exactly three leases: NovaTech (0.82% remaining, critical), Cluster-Omega (29.8%, warning), Arch-Node-7 (76.2%, healthy/inbound)
- Created `MOCK_HISTORY` with 8 CC transactions (4 in, 4 out) consistent with -1847 net balance narrative, and `MOCK_SCU_HISTORY` with 23 V-dip time-series points matching portfolio's final available value
- All timestamps use `Date.now()` arithmetic — demo is always live at any launch time
- `npm run build` exits 0; entire Phase 1 deliverable compiles cleanly

## Task Commits

Each task was committed atomically:

1. **Task 1: Create mock portfolio and lease data** - `04f4de2` (feat)
2. **Task 2: Create mock CC transaction history and SCU history data** - `282e459` (feat)

**Plan metadata:** (docs commit pending)

## Files Created/Modified
- `frontend/src/lib/data/mock-portfolio.ts` - MOCK_PORTFOLIO: Aria Chen with 100M CAU, -1847 CC balance, 1_087_340 available SCU
- `frontend/src/lib/data/mock-leases.ts` - MOCK_LEASES: three leases covering critical/warning/healthy urgency states with live NOW timestamps
- `frontend/src/lib/data/mock-history.ts` - MOCK_HISTORY (8 transactions), SCU_DataPoint interface, MOCK_SCU_HISTORY (23 points, V-dip narrative)

## Decisions Made
- `SCU_DataPoint` interface kept in `mock-history.ts` rather than `types/index.ts` — it is chart-specific (Recharts), not a domain entity
- `cauThreshold` in SCU history set to 500_000 for chart scale visibility (raw productionRatePerHour of 4,320/hr would be invisible at SCU chart scale)
- MOCK_HISTORY ordered newest-first to match expected Phase 3 Revolut-style rendering pattern

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- All three mock data files exist in `frontend/src/lib/data/` and compile cleanly
- Phase 1 complete: Next.js scaffold, domain types, urgency constants, and curated mock data all in place
- Phase 2 asset card components can import `MOCK_PORTFOLIO` directly from `@/lib/data/mock-portfolio`
- Phase 3 history panel can import `MOCK_HISTORY` and `MOCK_SCU_HISTORY` from `@/lib/data/mock-history`
- Phase 4 lease Gantt panel can import `MOCK_LEASES` from `@/lib/data/mock-leases`
- No blockers

---
*Phase: 01-foundation*
*Completed: 2026-03-21*
