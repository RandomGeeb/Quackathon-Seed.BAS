---
phase: 01-foundation
plan: "01"
subsystem: ui
tags: [nextjs, react, tailwind, shadcn, next-themes, typescript, app-router]

# Dependency graph
requires: []
provides:
  - Next.js 16.2.1 App Router scaffold inside frontend/ with TypeScript and Tailwind v4
  - Three-route dark dashboard shell (/, /leases, /history) sharing a single layout
  - Left sidebar DashboardNav Server Component with links to all three routes
  - Tailwind v4 globals.css with urgency-pulse animation and CSS variable theme system
  - Root layout with next-themes ThemeProvider enforcing dark mode (defaultTheme="dark")
  - shadcn/ui Nova preset (Radix base) with separator primitive
affects: [02-foundation, 03-foundation, 04-foundation, all subsequent phases]

# Tech tracking
tech-stack:
  added:
    - next@16.2.1
    - react@19.2
    - typescript@5.x
    - tailwindcss@4.x (CSS-first @theme config)
    - shadcn/ui (Nova preset, Radix base)
    - next-themes@0.4.6
    - lucide-react (via shadcn)
    - clsx + tailwind-merge (via shadcn cn() utility)
  patterns:
    - App Router route group (dashboard) — parentheses prevent URL segment
    - Server Component sidebar — no "use client" in layout or nav
    - next-themes ThemeProvider with suppressHydrationWarning on <html>
    - CSS variable dark mode theme via .dark class selector
    - Tailwind v4 @theme block for custom animation registration

key-files:
  created:
    - frontend/src/app/layout.tsx
    - frontend/src/app/globals.css
    - frontend/src/app/(dashboard)/layout.tsx
    - frontend/src/app/(dashboard)/page.tsx
    - frontend/src/app/(dashboard)/leases/page.tsx
    - frontend/src/app/(dashboard)/history/page.tsx
    - frontend/src/components/layout/DashboardNav.tsx
    - frontend/src/components/ui/button.tsx
    - frontend/src/components/ui/separator.tsx
    - frontend/src/lib/utils.ts
    - frontend/package.json
    - frontend/components.json
    - frontend/tsconfig.json
  modified:
    - frontend/src/app/globals.css (urgency-pulse animation added)
    - frontend/src/app/layout.tsx (ThemeProvider wrapping)

key-decisions:
  - "shadcn 4.x uses Nova preset by default (--defaults flag); New York/zinc are superseded naming — Nova is the current equivalent"
  - "Nested .git from create-next-app removed immediately — all frontend files tracked by outer repo as regular files"
  - "globals.css preserved shadcn's CSS variable system (@theme inline) and appended urgency-pulse as a second @theme inline block"
  - "Root layout uses Geist font variables removed in favor of clean ThemeProvider-only layout per plan specification"

patterns-established:
  - "Pattern 1: Route group (dashboard) — all dashboard routes share layout without URL prefix"
  - "Pattern 2: Server Component sidebar — DashboardNav has no use client, uses Link + lucide-react"
  - "Pattern 3: Tailwind v4 @theme for custom animations — defines --animate-X CSS variable that generates utility class"
  - "Pattern 4: Dark mode via next-themes ThemeProvider with defaultTheme=dark and enableSystem=false"

requirements-completed: [FOUND-01]

# Metrics
duration: 4min
completed: 2026-03-21
---

# Phase 1 Plan 01: Next.js App Router dark dashboard shell with sidebar navigation

**Next.js 16.2.1 scaffold inside frontend/ with three-route App Router shell (/, /leases, /history), left sidebar Server Component, and next-themes dark mode enforcement via Tailwind v4 CSS variable theme**

## Performance

- **Duration:** 4 min
- **Started:** 2026-03-21T19:29:45Z
- **Completed:** 2026-03-21T19:33:28Z
- **Tasks:** 2/2
- **Files modified:** 13

## Accomplishments

- Scaffolded Next.js 16.2.1 with TypeScript, Tailwind v4, App Router, and src/ directory inside the empty frontend/ directory
- Installed and initialized shadcn/ui (Nova/Radix preset, Tailwind v4 compatible) plus next-themes for dark mode
- Created (dashboard) route group with DashboardNav sidebar Server Component — no "use client" directive anywhere in Phase 1 files
- Configured globals.css with Tailwind v4 syntax (@import "tailwindcss") and urgency-pulse keyframes animation (used by Phase 4)
- npm run build exits 0: all three routes (/, /leases, /history) compile and prerender statically without TypeScript errors

## Task Commits

Each task was committed atomically:

1. **Task 1: Scaffold Next.js 16 app with shadcn and dark mode** - `1700448` (feat)
2. **Task 2: Create App Router route group with sidebar navigation** - `4bab2ad` (feat)

## Files Created/Modified

- `frontend/src/app/layout.tsx` - Root layout with ThemeProvider (dark mode default, suppressHydrationWarning)
- `frontend/src/app/globals.css` - Tailwind v4 syntax, full CSS variable theme, urgency-pulse animation
- `frontend/src/app/(dashboard)/layout.tsx` - Dashboard shell: DashboardNav sidebar + main content area
- `frontend/src/app/(dashboard)/page.tsx` - / route placeholder (Dashboard page)
- `frontend/src/app/(dashboard)/leases/page.tsx` - /leases route placeholder
- `frontend/src/app/(dashboard)/history/page.tsx` - /history route placeholder
- `frontend/src/components/layout/DashboardNav.tsx` - Left sidebar Server Component with nav links
- `frontend/src/components/ui/button.tsx` - shadcn button primitive (auto-generated)
- `frontend/src/components/ui/separator.tsx` - shadcn separator primitive (added for sidebar use)
- `frontend/src/lib/utils.ts` - cn() utility (clsx + tailwind-merge)
- `frontend/package.json` - Next.js 16.2.1, next-themes, full dep list
- `frontend/components.json` - shadcn config (Nova preset, Radix base, Tailwind v4)
- `frontend/tsconfig.json` - TypeScript strict config with @/* path alias

## Decisions Made

- **shadcn 4.x Nova preset:** shadcn CLI v4.1.0 replaced New York/zinc naming with preset system. Used `--defaults` flag which selects Nova (Radix/Lucide/Geist) — functionally equivalent to New York/zinc for this project's needs.
- **Nested .git removal:** create-next-app initializes a git repo inside frontend/. Removed the nested .git and re-committed to ensure all frontend files are tracked by the outer repo as regular files rather than a git submodule.
- **globals.css strategy:** Preserved shadcn's CSS variable system (complete @theme inline block with color tokens, .dark overrides) and appended the urgency-pulse animation as an additional @theme inline block below. This keeps shadcn's auto-generated theme intact while satisfying the plan's animation requirement.
- **Clean root layout:** Replaced scaffolded layout (Geist fonts + font variable classNames) with the plan-specified ThemeProvider-only layout. Geist font loading removed to keep the layout minimal and dark mode focused.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Removed nested .git repository from frontend/**
- **Found during:** Task 1 (scaffold step)
- **Issue:** create-next-app initializes git inside the new directory, creating a nested repo that git tracks as a submodule (160000 mode) rather than regular files. All frontend file contents would be invisible to the outer repo.
- **Fix:** Ran `git rm --cached frontend` to deregister the submodule pointer, then `rm -rf frontend/.git` to remove the nested git, then re-staged and committed all frontend files as regular tracked files.
- **Files modified:** All frontend/ files (now tracked normally)
- **Verification:** `git log --stat HEAD` shows all frontend files listed as individual file changes
- **Committed in:** `1700448` (Task 1 commit — same commit as scaffold)

---

**Total deviations:** 1 auto-fixed (1 bug — nested git repo)
**Impact on plan:** Necessary correctness fix. No scope creep.

## Issues Encountered

- shadcn CLI 4.1.0 changed the interactive prompts — the `-t next` flag alone does not skip prompts in v4. Used `--defaults` (`-d`) flag which accepts Nova/Radix as the default preset without interaction. Nova is the current equivalent of New York style in shadcn 4.x.

## User Setup Required

None — no external service configuration required.

## Next Phase Readiness

- Next.js 16.2.1 app fully scaffolded and building cleanly
- App Router (dashboard) route group ready for Phase 2 components (TypeScript types, mock data, urgency constants)
- DashboardNav sidebar already links to all three routes — Phase 2 can add content directly to page.tsx files
- Tailwind v4 dark mode CSS variables fully configured — FOUND-02, FOUND-03, FOUND-04 can proceed immediately
- globals.css has urgency-pulse animation ready for Phase 4 Gantt bars

---
*Phase: 01-foundation*
*Completed: 2026-03-21*
