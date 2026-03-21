# Project Research Summary

**Project:** ComputeBank
**Domain:** Fintech banking dashboard — compute-as-currency (CAU / SCU / CC)
**Researched:** 2026-03-21
**Confidence:** MEDIUM

## Executive Summary

ComputeBank is a single-user fintech dashboard that visualises a "compute-as-currency" economy where hardware units (CAU) generate spendable compute (SCU), which can be leased to counterparties with time-limited expiry. The recommended approach is a Next.js 15 App Router application with shadcn/ui components, Recharts for all visualisation, and Framer Motion for urgency animations. The entire data layer uses hardcoded TypeScript mock data — no backend, no API, no WebSockets. This is the correct approach for a hackathon context: it eliminates all infra risk and allows 100% focus on the demo's visual and experiential quality.

The most important thing to get right is the combination of live countdown timers on active leases and the visual urgency escalation (green to yellow to pulsing red). This is the emotional core of the product. Judges will remember the moment a lease ticks into critical territory and the dashboard shifts into a debt-state warning mode. Everything else — charts, history table, send/lend flow — is supporting context. The SCU allocation donut, CC balance history chart with a below-zero red fill, and the SCU depletion forecast line are the three chart showpieces that make the compute economy legible without explanation.

The main risks are technical: setInterval memory leaks from timer components (easily avoided with a single top-level tick), Recharts charts re-rendering on every timer tick (fixed with React.memo and isAnimationActive={false} at chart creation), and the CC below-zero gradient being skipped under time pressure (treat it as day-one requirement, not polish). The secondary risk is scope creep — the Send/Lend SCU flow is genuinely complex and should only be attempted after the core dashboard is fully polished. Hackathon success comes from a flawless 3-minute demo path, not feature breadth.

---

## Key Findings

### Recommended Stack

The stack is essentially locked by the project specification: Next.js 15 with App Router, React 19, TypeScript 5, Tailwind CSS 3, shadcn/ui, and Recharts (via shadcn chart primitives). No deviations are warranted. Framer Motion 11 is the correct addition for state-driven urgency animations; Tailwind's built-in `animate-pulse` handles purely decorative pulses. State management is React Context for the global mock data store and plain `useState`/`useEffect` for timers — no Zustand, Redux, or React Query needed, as there is no async server state.

The key version concern: verify whether shadcn's `init` command defaults to Tailwind v3 or v4 at the time of scaffolding (March 2026), as the configuration syntax changed between versions. This is the only pre-build verification step that matters.

**Core technologies:**
- Next.js 15 (App Router): full-stack React framework — stable default, RSC support, route groups for dashboard layout
- React 19: UI runtime — ships with Next.js 15, no reason to pin lower
- TypeScript 5: type safety — non-negotiable for the multi-state asset model (available / consumed / reserved / leased)
- Tailwind CSS 3: utility CSS — ships with shadcn toolchain; stay on v3 for stable compatibility unless shadcn init defaults to v4 by March 2026
- shadcn/ui (CLI-installed): all UI primitives — copy-paste source, no version lock-in, full customisability
- Recharts 2.x (via shadcn chart): chart rendering — project-specified library, well-documented at training cutoff
- Framer Motion 11.x: state-reactive urgency animations — `animate` + `keyframes` + `transition.repeat: Infinity` for timer-triggered urgency loops
- React Context + useState/useEffect: state management — sufficient for static mocked data with isolated timer state

### Expected Features

**Must have (table stakes):**
- Asset balance cards (CAU, SCU, CC) with sign/colour — primary information hierarchy, every banking dashboard starts here
- Active leases Gantt panel with live countdown timers — the unique mechanic of this economy, most dramatic visual, core demo moment
- SCU allocation donut chart — makes the four-state economy (available / consumed / reserved / leased) tangible at a glance
- Debt state UI mode — when CC < 0 and active leases exist, the dashboard shifts into a distinct visual warning state
- Pulsing urgency alerts — near-expiry leases trigger animated alerts; highest emotional impact relative to implementation cost
- Transaction and lease history table — baseline fintech credibility

**Should have (differentiators):**
- CC balance history chart with below-zero red fill — visual tour de force; communicates debt without text; requires Recharts gradient zero-crossing work
- SCU depletion forecast line — "you will hit zero at [datetime]" is the most urgent signal in this economy; a killer demo moment
- CAU yield rate display — shows CAU generating SCU/hour, grounds the economy's logic with minimal effort

**Defer to v2 or build last if time allows:**
- Send / Lend SCU flow — highest complexity, multi-step form with validation and preview step; only attempt once everything above is polished
- All anti-features: real auth, WebSocket backend, multi-user views, mobile responsive layout, settings pages, notification systems, dark mode toggle

### Architecture Approach

The architecture follows a clean Server Component / Client Component island pattern within Next.js App Router. Static layout and data display stay as Server Components; interactive elements (Recharts charts, countdown timers, modal forms) are Client Components. A single `setInterval` in `LeasePanel` drives all lease countdowns by passing a shared `now` timestamp as a prop to each `LeaseRow`, which derives its remaining time and urgency level at render time. Mock data lives exclusively in `lib/data/` as plain typed TypeScript modules, passed as serializable props from Server Component pages to Client Component islands. Charts receive pre-shaped, memoized data — never raw mock data transformed inside the chart component.

**Major components:**
1. `AssetCardGrid` / `AssetCard` — server components displaying CAU / SCU / CC balances with sign colouring
2. `LeasePanel` / `LeaseRow` / `CountdownTimer` — client components; single interval tick drives all timers; urgency level derived from thresholds at render time
3. `ScuAllocationChart` — client component; Recharts PieChart showing four-state SCU breakdown
4. `CcBalanceChart` — client component; Recharts AreaChart with linearGradient zero-crossing for debt fill
5. `ScuForecastChart` — client component; Recharts LineChart with ReferenceLine at y=0 for depletion projection
6. `HistoryTable` — server component; tabular transaction list, no interactivity
7. `SendScuModal` — client component; multi-step form with react-hook-form; build last
8. `lib/data/mock-*.ts` — pure TypeScript data modules; the demo script, not just test fixtures

### Critical Pitfalls

1. **setInterval memory leaks in countdown timers** — use a single top-level interval in `LeasePanel` that updates a `now` state; all `LeaseRow` children derive `secondsRemaining = expiresAt - now`; always return `clearInterval` in `useEffect` cleanup; React Strict Mode will double-invoke effects in dev, so missing cleanup will be obvious immediately
2. **Recharts re-rendering on every timer tick** — isolate timer state from chart component scope; wrap all chart components in `React.memo`; set `isAnimationActive={false}` on all Recharts series (`<Area>`, `<Line>`, `<Bar>`) at chart creation time, not as a retrofit
3. **Mock data that looks obviously fake** — treat mock data as a curated demo script; use non-round numbers (SCU: 4_847.3, not 5000); include at least one lease in each urgency state; include a negative CC balance; stagger transaction timestamps with slight irregularity; design the data before building any UI
4. **Debt / negative balance state treated as an afterthought** — the CC balance history chart must have a Recharts `linearGradient` with a zero-crossing fill from day one; a default blue fill going below the axis looks like a rendering bug during the demo; additionally show a debt alert banner when CC < 0
5. **Scope creep killing core demo quality** — define the 3-minute judge walkthrough on day one; the Send/Lend flow is useful but not the hero; finish the core dashboard with polished urgency animations before touching secondary flows

---

## Implications for Roadmap

Based on combined research, the build order is driven by two forces: (1) dependency order — types and data before components, layout before features, and (2) demo-path priority — the hero experience before secondary flows. The architecture research explicitly defines a 11-step build sequence that aligns with these forces and should be treated as the authoritative ordering constraint.

### Phase 1: Foundation — Types, Mock Data, and Shell

**Rationale:** Everything in the app depends on the TypeScript type definitions and the mock data modules. Building these first eliminates a major source of mid-build rework. The dashboard shell (layout, nav, header) can be built in parallel as it has no data dependencies. This phase has zero integration risk.

**Delivers:** Runnable Next.js app with correct layout shell, typed data model, and a realistic demo script embedded in the mock data (all urgency states present, negative CC balance, non-round numbers). No visible features yet, but the foundation is correct.

**Addresses:** Asset balance data model (CAU, SCU, CC), lease data model (startedAt, expiresAt, counterparty, scuAmount), transaction history schema, forecast time-series schema.

**Avoids:** Mock data that looks obviously fake (Pitfall 3) — design the data before any UI exists. Also avoids Dates as Date objects in props (ARCHITECTURE anti-pattern 5) by defining timestamps as `number` from the start.

### Phase 2: Static Dashboard — Asset Cards and Layout Grid

**Rationale:** Asset cards are pure server components with no interactivity. They are the fastest path to a "real data on screen" moment. Building them second validates that the mock data modules, type definitions, and shadcn Card component are all wired correctly before adding any complexity.

**Delivers:** Visible dashboard with CAU, SCU, and CC balance cards, sign colouring (red for negative CC), and a grid layout that won't break at 1280–1440px.

**Addresses:** Asset balance cards (table stakes), balance sign / direction indicator (table stakes), current period summary, responsive desktop layout.

**Avoids:** Uneven card heights (Pitfall 9) — apply `grid grid-cols-3 items-stretch` and `h-full` on cards in this phase, not as a fix later.

### Phase 3: Active Leases Panel — Timers and Gantt Bars

**Rationale:** The lease timer infrastructure is the most complex interactive piece. Building it third, before any charts, ensures the hardest problem is solved while the team has full energy. The architecture research is explicit: this is the build-before-charts rule. Urgency derivation utilities (`lib/urgency.ts`) are also established here for reuse.

**Delivers:** `LeasePanel` with live countdown timers, colour-coded Gantt bars scaled to actual time range, urgency state transitions (green → yellow → pulsing red), and expiry handling. This is the emotional core of the demo.

**Addresses:** Active leases Gantt panel (differentiator), live countdown timers per lease (differentiator), pulsing urgency alerts (differentiator), lease counterparty display.

**Avoids:** setInterval memory leaks (Pitfall 1) — single top-level tick in `LeasePanel` from day one. Gantt bars not scaling to time range (Pitfall 8) — compute bar width from `startedAt`/`expiresAt` from day one. Hardcoded colour strings (Pitfall 11) — use the urgency class map from `lib/urgency.ts`.

### Phase 4: Core Charts — SCU Allocation Donut

**Rationale:** The donut chart is the simplest Recharts integration. Build it first among charts to validate the shadcn chart setup, confirm Recharts `"use client"` boundaries work correctly, and establish the `React.memo` + `isAnimationActive={false}` pattern that all subsequent charts must follow.

**Delivers:** `ScuAllocationChart` showing four-state SCU breakdown (available / consumed / reserved / leased) with hover tooltips. Also validates the Recharts SSR guard (dynamic import with `ssr: false` or `"use client"` directive).

**Addresses:** SCU allocation donut (differentiator).

**Avoids:** Recharts re-rendering on timer tick (Pitfall 2) — `React.memo` and `isAnimationActive={false}` applied at chart creation. Recharts SSR crash (Pitfall 12) — `"use client"` directive confirmed on first chart.

### Phase 5: Advanced Charts — CC History and SCU Forecast

**Rationale:** These two charts are the most technically complex visualisations. The CC balance history requires a Recharts `linearGradient` zero-crossing fill — a non-trivial but known pattern. The SCU forecast requires computing a burn rate from mock transaction data and rendering a dashed projection line. Both build on the patterns established in Phase 4.

**Delivers:** `CcBalanceChart` with red fill below zero and a debt alert banner trigger. `ScuForecastChart` with a projected depletion line and labelled zero-crossing datetime. These two charts together complete the "financial drama" of the demo.

**Addresses:** CC balance history chart (differentiator), SCU depletion forecast line (differentiator), debt state UI mode (differentiator).

**Avoids:** Debt state treated as afterthought (Pitfall 4) — gradient zero-crossing built in at chart creation, not retrofitted. Recharts tooltip overflow (Pitfall 7) — configure `<Tooltip>` positioning when building these charts.

### Phase 6: History Table and Navigation Polish

**Rationale:** The history table is a pure server component with no interactivity. It is quick to build and adds fintech credibility. Navigation polish (confirming route transitions between /, /leases, /history) happens here since all destination content now exists.

**Delivers:** `HistoryTable` with sortable columns, status badges, counterparty names, and staggered timestamps. Functional three-route navigation.

**Addresses:** Transaction / lease history table (table stakes), status indicators / badges (table stakes), navigation / sidebar (table stakes), empty / zero state handling.

**Avoids:** None of the critical pitfalls are concentrated here. Low risk phase.

### Phase 7: Send / Lend SCU Flow (If Time Allows)

**Rationale:** The Send/Lend modal is the highest complexity feature and explicitly not on the critical demo path. Build it last, only after all phases above are polished and the 3-minute demo script is fully exercisable. If time runs out, this phase is cleanly deferrable without affecting anything else.

**Delivers:** `SendScuModal` with multi-step form (amount, duration, counterparty), available SCU validation, and a preview step showing the resulting Gantt bar before confirmation.

**Addresses:** Send / Lend SCU flow (FEATURES.md "build last" category).

**Avoids:** Scope creep killing core demo quality (Pitfall 5) — by placing this phase last with an explicit "skip if time is short" instruction.

### Phase Ordering Rationale

- Types and mock data first because every component depends on them; designing the data as a demo script (Pitfall 3) is only possible before UI exists
- Layout shell first because it has no dependencies and unblocks visual feedback for all subsequent phases
- Timer infrastructure before charts because it is the hardest interactive problem; solving it early reduces risk and validates the `now`-prop propagation pattern that charts will reuse
- Donut chart before complex charts to establish `"use client"` boundaries, `React.memo`, and `isAnimationActive={false}` as standards
- CC gradient chart and forecast line grouped together because they share the chart-area section of the dashboard and the debt-state context flag
- History table and nav polish after all featured content is present — there is nothing to navigate to until Phases 3–5 are done
- Send/Lend last and explicitly optional — the demo path does not require it, and its complexity poses the highest scope-creep risk

### Research Flags

Phases likely needing a spike or additional research before implementation:

- **Phase 5 (CC gradient chart):** The Recharts `linearGradient` zero-crossing pattern requires computing `stopOffset = yMax / (yMax - yMin)` based on the data domain. The exact implementation varies across community examples and is not in the official Recharts docs. Allocate time for a standalone spike before building this chart in the full dashboard context.
- **Phase 5 (Gantt colour transitions):** Smooth CSS colour transitions on the Gantt bar (green → yellow → red) may require CSS custom properties or computed styles rather than a simple class swap. Tailwind's JIT compiler may not generate the intermediate transition classes. Test the animation at 0.5x speed in DevTools to confirm it looks intentional.
- **Phase 7 (Send/Lend preview step):** The preview step that shows a projected Gantt bar before confirming the lease is the highest complexity UI interaction. If the Send/Lend flow is attempted, scope the preview step separately and be ready to cut it to a single-step confirmation.

Phases with standard, well-documented patterns (skip deeper research):

- **Phase 1 (Foundation):** TypeScript interfaces and Next.js App Router layout are well-documented with official sources. No research needed.
- **Phase 2 (Asset Cards):** shadcn Card component and Tailwind grid layout are standard. No research needed.
- **Phase 3 (Timer Infrastructure):** The single-interval `useEffect` pattern is fundamental React. The architecture research provides complete, tested code. No research needed.
- **Phase 4 (Donut Chart):** Recharts PieChart with a `Cell` per segment is one of the most common Recharts patterns. No research needed.
- **Phase 6 (History Table):** shadcn Table component is standard. No research needed.

---

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | MEDIUM | Next.js 15 and React 19 confirmed at training cutoff (Aug 2025). Tailwind v3/v4 and exact Recharts version that ships with shadcn chart in March 2026 must be verified before scaffolding. Core framework choices are locked by project spec — no deviation. |
| Features | HIGH | Table-stakes features draw on established fintech dashboard conventions (MEDIUM for domain knowledge). Differentiating features are derived directly from `.planning/PROJECT.md` requirements (HIGH for spec-driven features). Feature dependency tree is logical, not speculative. |
| Architecture | HIGH | Next.js App Router layout conventions verified against official docs (HIGH). `useEffect` + `setInterval` timer pattern is fundamental React (HIGH). Recharts `"use client"` boundary and `isAnimationActive` are well-documented (HIGH). Recharts zero-crossing gradient is MEDIUM — community pattern, not in official docs. |
| Pitfalls | MEDIUM | setInterval cleanup, Recharts re-render, and SSR pitfalls draw on official React and Next.js docs (HIGH). Mock data quality and scope creep are author-experience-level guidance (MEDIUM). Recharts gradient zero-crossing as a debt-state pitfall is MEDIUM confidence. |

**Overall confidence:** MEDIUM — sufficient to proceed to roadmap creation. Identified gaps are narrow and implementation-level, not architectural.

### Gaps to Address

- **Tailwind version at scaffolding time:** Before running `create-next-app`, verify whether shadcn's `init` command defaults to Tailwind v3 or v4 in March 2026. If v4, `globals.css` configuration syntax changes. Check `https://ui.shadcn.com/docs/installation/next` before first commit.
- **Recharts version bundled with shadcn chart:** After `npx shadcn@latest add chart`, check `package.json` for the exact Recharts version. API surface is stable across 2.x but confirm no breaking changes in any 3.x release if applicable.
- **CC chart zero-crossing gradient:** Run a standalone spike against the exact Recharts version in use to confirm the `linearGradient gradientUnits="userSpaceOnUse"` + computed `stopOffset` pattern works as documented. Do not leave this as an assumption going into Phase 5.
- **Gantt colour transition implementation:** Test whether a Tailwind class swap produces an abrupt or smooth colour transition on the Gantt bar background. If abrupt, use a CSS custom property (`--lease-bar-color`) driven by a computed inline style from the urgency level.
- **Burn rate definition for forecast:** The SCU depletion forecast requires defining what "burn rate" means in the mock data model. Decide whether burn rate is a fixed constant per mock user, derived from active lease SCU amounts, or derived from transaction history — and encode this in `lib/data/mock-forecast.ts` before Phase 5.

---

## Sources

### Primary (HIGH confidence)
- `.planning/PROJECT.md` — project specification, feature requirements, technology constraints
- `https://nextjs.org/docs/app/getting-started/layouts-and-pages` — Next.js App Router routing and layout conventions (verified 2026-03-20)
- React documentation on `useEffect` cleanup: `https://react.dev/reference/react/useEffect` — timer cleanup pattern
- Recharts `isAnimationActive` prop: `https://recharts.org/en-US/api/Area` — chart animation control
- Next.js `"use client"` boundary: `https://nextjs.org/docs/app/building-your-application/rendering/client-components` — server/client boundary rules
- Next.js dynamic import with `ssr: false`: `https://nextjs.org/docs/pages/building-your-application/optimizing/lazy-loading` — Recharts SSR guard

### Secondary (MEDIUM confidence)
- shadcn/ui component catalogue (training data, Aug 2025) — Card, Badge, Table, Progress, Alert, Tabs, Tooltip, Sheet, Dialog, Chart components
- Recharts community patterns (training data, Aug 2025) — zero-crossing gradient technique, horizontal bar Gantt layout
- Framer Motion 11.x API (training data, Aug 2025) — `animate`, `keyframes`, `transition.repeat` for urgency loops
- Fintech dashboard conventions (training data, Aug 2025) — balance cards, history tables, status badges, debt state treatment

### Tertiary (LOW confidence)
- Recharts gradient zero-crossing exact implementation — community Stack Overflow and GitHub issues; no single canonical source; requires implementation spike to confirm

---
*Research completed: 2026-03-21*
*Ready for roadmap: yes*
