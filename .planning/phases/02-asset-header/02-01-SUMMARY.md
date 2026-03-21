---
phase: 02-asset-header
plan: 01
subsystem: ui
tags: [nextjs, react, shadcn, tailwind, lucide-react, typescript]

# Dependency graph
requires:
  - phase: 01-foundation
    provides: "CC/SCU/Portfolio types, URGENCY_TEXT_COLORS, MOCK_PORTFOLIO, cn() utility, lucide-react dependency"
provides:
  - "shadcn Card component (Card, CardHeader, CardContent, CardTitle, CardDescription, CardFooter, CardAction)"
  - "CCCard: Revolut-style CC balance display with debt indicator (red text + border)"
  - "SCUCard: available/total SCU display with abbreviation formatter (B/M/K)"
affects:
  - 02-asset-header (Plan 02 composes these into AssetHeader with action buttons)
  - 03-charts (Phase 3 may reference card patterns)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Server Component by default — no 'use client' unless interactive"
    - "CSS variable Tailwind classes only — text-foreground, text-muted-foreground, border-border"
    - "URGENCY_TEXT_COLORS import for debt indicator — no hardcoded hex values"
    - "Intl.NumberFormat for dollar formatting (comma-separated, no abbreviation)"
    - "toFixed + regex replace for SCU abbreviation (strips trailing zeros)"
    - "cn() for conditional class composition — never string concatenation"

key-files:
  created:
    - frontend/src/components/ui/card.tsx
    - frontend/src/components/asset-header/CCCard.tsx
    - frontend/src/components/asset-header/SCUCard.tsx
  modified: []

key-decisions:
  - "shadcn Card uses ring-1 ring-foreground/10 (not border utility) — CCCard adds border border-red-500/40 as additional className override for debt state"
  - "Card exports: Card, CardHeader, CardFooter, CardTitle, CardAction, CardDescription, CardContent — all seven available for Plan 02"
  - "button.tsx uses asChild pattern via @base-ui/react/button — card.tsx does NOT use asChild (plain div wrappers); asChild not needed for Plan 02 action buttons"

patterns-established:
  - "Asset card pattern: Card + CardContent shell, flex row with number+label left / icon right"
  - "Debt indicator: isDebt = balance < 0 drives conditional cn() for both text color and border"
  - "SCU display: available (large bold foreground) + ' / ' + total (muted smaller) as compound display"

requirements-completed: [ASSET-01, ASSET-02, ASSET-03]

# Metrics
duration: 2min
completed: 2026-03-21
---

# Phase 2 Plan 01: Asset Header Cards Summary

**shadcn Card scaffolded via CLI plus CCCard (Revolut debt-red indicator via URGENCY_TEXT_COLORS) and SCUCard (1.09M/100M abbreviation via Intl+regex) as pure Server Components**

## Performance

- **Duration:** ~2 min
- **Started:** 2026-03-21T20:15:07Z
- **Completed:** 2026-03-21T20:16:41Z
- **Tasks:** 3
- **Files modified:** 3

## Accomplishments
- Installed shadcn Card via `npx shadcn@latest add card --yes` — generated all 7 exports cleanly
- CCCard renders "-$1,847" in `text-red-500` with `border border-red-500/40` on first load (MOCK_PORTFOLIO debt state)
- SCUCard renders "1.09M / 100M" with available prominent and total muted, using a multi-magnitude abbreviation formatter
- TypeScript check (`npx tsc --noEmit`) exits 0 — zero errors

## Card Component Exports (Actually Generated)

The following named exports were confirmed in the generated `card.tsx`:
- `Card` — root div with `ring-1 ring-foreground/10` border styling
- `CardHeader` — grid layout supporting action slot
- `CardTitle` — heading with `font-heading` class
- `CardDescription` — muted text description
- `CardAction` — positioned slot for card-level actions
- `CardContent` — padded content area (used by CCCard and SCUCard)
- `CardFooter` — muted background footer with border-t

Note: Card uses `ring-1 ring-foreground/10` (not Tailwind's `border` utility) for its default border appearance. For CCCard's debt indicator, `border border-red-500/40` is applied as a className override — this adds a visible CSS border in addition to the ring.

## Button asChild Assessment (for Plan 02)

`button.tsx` uses `@base-ui/react/button` as its underlying primitive via `ButtonPrimitive`. It does NOT use a `asChild` prop — it wraps `ButtonPrimitive` directly with `data-slot="button"`. The action buttons in Plan 02 (Add, Swap, Transfer) will use `Button` directly with `onClick` or `Link` wrapping — asChild is NOT needed and NOT supported by this button implementation.

## Task Commits

Each task was committed atomically:

1. **Task 1: Scaffold shadcn Card component** - `ffa5018` (chore)
2. **Task 2: Build CCCard with Revolut-style formatting and debt indicator** - `7591a6c` (feat)
3. **Task 3: Build SCUCard with abbreviation formatter** - `b1f7f7c` (feat)

## Files Created/Modified
- `frontend/src/components/ui/card.tsx` — shadcn Card primitive (7 exports: Card, CardHeader, CardContent, CardTitle, CardDescription, CardFooter, CardAction)
- `frontend/src/components/asset-header/CCCard.tsx` — CC balance card: debt indicator, Intl.NumberFormat formatting, URGENCY_TEXT_COLORS import
- `frontend/src/components/asset-header/SCUCard.tsx` — SCU available/total card: multi-magnitude abbreviation formatter with trailing zero stripping

## Decisions Made
- Used `border border-red-500/40` as className override on Card for debt state — the shadcn Card generates with `ring` styling, so adding a CSS `border` class alongside provides the visible red border the plan specifies
- Followed plan exactly for `border-red-500/40` (not `ring-red-500/40`) to match plan specification literally

## Deviations from Plan

None — plan executed exactly as written. All acceptance criteria passed on first attempt.

## Issues Encountered

None — `npx shadcn@latest add card --yes` ran non-interactively without issues. TypeScript check clean.

## User Setup Required

None — no external service configuration required.

## Next Phase Readiness

- `Card`, `CCCard`, `SCUCard` are ready to be composed into `AssetHeader` in Plan 02
- Plan 02 should use `grid grid-cols-2 gap-4` to place CCCard and SCUCard side by side
- Action buttons (Add/Swap/Transfer) in Plan 02: use `Button` directly — no asChild needed
- Route stubs `/add`, `/swap`, `/transfer` still need creation in Plan 02
- Dashboard page.tsx still needs AssetHeader integration in Plan 02

## Self-Check: PASSED

All 3 created files confirmed on disk. All 3 task commits (ffa5018, 7591a6c, b1f7f7c) confirmed in git log.

---
*Phase: 02-asset-header*
*Completed: 2026-03-21*
