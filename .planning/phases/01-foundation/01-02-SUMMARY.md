---
phase: 01-foundation
plan: "02"
subsystem: ui
tags: [typescript, types, constants, tailwind, urgency-system, domain-model]

# Dependency graph
requires:
  - phase: 01-01
    provides: Next.js 16 App Router scaffold with @/* path alias in tsconfig.json and urgency-pulse animation in globals.css
provides:
  - frontend/src/types/index.ts with seven exported TypeScript types/interfaces (UrgencyLevel, CAU, SCU, CC, Lease, Transaction, Portfolio)
  - frontend/src/lib/constants/urgency.ts with four exported constants and getUrgencyLevel pure function
  - Percentage-based urgency threshold system (>50%=healthy, 10-50%=warning, <10%=critical)
  - Single source of truth for all Tailwind urgency colour class strings — no hex values in any hand-authored file
affects: [02-foundation, 03-foundation, 04-foundation, all subsequent phases]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - TypeScript strict mode already on from create-next-app (tsconfig had "strict": true from Plan 01)
    - UrgencyLevel discriminated union type drives the entire colour and animation system
    - All timestamps typed as number (ms epoch) — enforced by type system to prevent hydration errors
    - Urgency constants use Record<UrgencyLevel, string> for exhaustive mapping — TypeScript enforces all four levels
    - getUrgencyLevel is a pure function with no side effects — safe to call in any context (Server or Client)

key-files:
  created:
    - frontend/src/types/index.ts
    - frontend/src/lib/constants/urgency.ts
  modified: []

key-decisions:
  - "Timestamps typed as number (ms epoch) throughout — prevents Date object serialization errors across Next.js Server/Client boundary"
  - "Urgency thresholds are percentage-based (CONTEXT.md locked decision): >50%=healthy, 10-50%=warning, <10%=critical"
  - "getUrgencyLevel(msRemaining, msTotal) requires both parameters — percentage calculation not single-value absolute threshold"
  - "URGENCY_TEXT_COLORS added as fourth export (not in original plan) to cover countdown timer use case in Phase 4 without needing full URGENCY_CLASSES string"

patterns-established:
  - "Pattern 1: Single constants file rule — all urgency Tailwind classes live in lib/constants/urgency.ts, zero hex values in hand-authored files"
  - "Pattern 2: Record<UrgencyLevel, string> pattern — any new urgency-mapped constant must use this type for TypeScript exhaustiveness checking"
  - "Pattern 3: Import path @/types — all components import domain types via alias, never relative paths"
  - "Pattern 4: Pure derivation functions in constants files — getUrgencyLevel has no imports beyond the type, safe anywhere in the render tree"

requirements-completed: [FOUND-02, FOUND-04]

# Metrics
duration: 2min
completed: 2026-03-21
---

# Phase 1 Plan 02: TypeScript domain types and single-source urgency colour constant system

**Seven exported domain types (CAU/SCU/CC/Lease/Transaction/Portfolio/UrgencyLevel) with percentage-based urgency threshold function and exhaustive Tailwind class maps — zero hardcoded hex values**

## Performance

- **Duration:** 2 min
- **Started:** 2026-03-21T19:36:43Z
- **Completed:** 2026-03-21T19:38:01Z
- **Tasks:** 2/2
- **Files modified:** 2

## Accomplishments

- Created `frontend/src/types/index.ts` with all five domain entity interfaces (CAU, SCU, CC, Lease, Transaction) plus Portfolio and UrgencyLevel — seven exports total
- Created `frontend/src/lib/constants/urgency.ts` with four Record<UrgencyLevel, string> constants (URGENCY_CLASSES, URGENCY_BAR_CLASSES, URGENCY_TEXT_COLORS, URGENCY_THRESHOLDS) and the getUrgencyLevel pure function
- TypeScript strict mode already enabled from Plan 01 scaffold — both files compiled with zero errors (exit 0)
- Grep confirms zero hardcoded hex values in any hand-authored .ts or .tsx source file

## Task Commits

Each task was committed atomically:

1. **Task 1: Create TypeScript domain types** - `f0387f6` (feat)
2. **Task 2: Create urgency colour constants and threshold function** - `b82d683` (feat)

**Plan metadata:** pending (docs commit)

## Files Created/Modified

- `frontend/src/types/index.ts` - Seven exported types: UrgencyLevel discriminated union, CAU/SCU/CC/Lease/Transaction/Portfolio interfaces; all timestamps typed as number (ms epoch)
- `frontend/src/lib/constants/urgency.ts` - Four exports (URGENCY_THRESHOLDS, URGENCY_CLASSES, URGENCY_BAR_CLASSES, URGENCY_TEXT_COLORS) plus getUrgencyLevel(msRemaining, msTotal) pure function; imports UrgencyLevel from @/types

## Decisions Made

- **URGENCY_TEXT_COLORS added as fourth constant:** The plan specified three constants (URGENCY_THRESHOLDS, URGENCY_CLASSES, URGENCY_BAR_CLASSES). A fourth, URGENCY_TEXT_COLORS, was added for the countdown timer text use case (Phase 4 lease rows need text colour only, not the full text+bg+border URGENCY_CLASSES string). This keeps the single-file rule intact and avoids future components reaching into URGENCY_CLASSES to extract only the text class.
- **TypeScript strict mode:** Already enabled from Plan 01 (create-next-app defaults to `"strict": true` in tsconfig.json). No changes needed.
- **Percentage thresholds confirmed:** CONTEXT.md locked decision applied exactly — `healthy: 0.5` (>50%), `warning: 0.1` (10-50%). The `getUrgencyLevel` function uses `ratio < warning` for critical and `ratio < healthy` for warning, returning healthy otherwise.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing Critical] Added URGENCY_TEXT_COLORS as fourth export**
- **Found during:** Task 2 (writing urgency.ts)
- **Issue:** Plan specified URGENCY_CLASSES (full text+bg+border) and URGENCY_BAR_CLASSES (bg only), but Phase 4 countdown timer components need text colour only. Without a dedicated export, components would either pull from URGENCY_CLASSES (wrong — includes bg/border classes) or hardcode a hex value (violates single-source rule).
- **Fix:** Added `URGENCY_TEXT_COLORS: Record<UrgencyLevel, string>` with text-only Tailwind classes to urgency.ts
- **Files modified:** frontend/src/lib/constants/urgency.ts
- **Verification:** TypeScript compiles cleanly; grep confirms no hex values; urgency.ts exports five items instead of four
- **Committed in:** `b82d683` (Task 2 commit)

---

**Total deviations:** 1 auto-fixed (1 missing critical — added URGENCY_TEXT_COLORS for completeness)
**Impact on plan:** Additive only — no existing exports changed, no plan objectives missed. Prevents future components from violating the no-hex-values rule.

## Issues Encountered

None — both files authored, compiled, and committed cleanly on first attempt.

## User Setup Required

None — no external service configuration required.

## Next Phase Readiness

- `frontend/src/types/index.ts` is ready for immediate import by Phase 2 asset card components (`import type { Portfolio, Lease } from '@/types'`)
- `frontend/src/lib/constants/urgency.ts` is ready for Phase 2 asset card header urgency indicators and Phase 4 lease Gantt bars
- `getUrgencyLevel` function confirmed to work with `lease.expiresAt - Date.now()` and `lease.expiresAt - lease.startedAt` pattern
- TypeScript compiles with exit 0 across entire project — Phase 3 (Plan 01-03) can scaffold mock data without type errors

## Self-Check: PASSED

- FOUND: frontend/src/types/index.ts
- FOUND: frontend/src/lib/constants/urgency.ts
- FOUND: .planning/phases/01-foundation/01-02-SUMMARY.md
- FOUND: commit f0387f6 (Task 1 — domain types)
- FOUND: commit b82d683 (Task 2 — urgency constants)

---
*Phase: 01-foundation*
*Completed: 2026-03-21*
