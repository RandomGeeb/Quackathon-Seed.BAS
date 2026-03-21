# Feature Landscape

**Domain:** Fintech banking dashboard — compute-as-currency (CAU / SCU / CC)
**Researched:** 2026-03-21
**Confidence note:** Web search and bash were unavailable in this session. All fintech domain knowledge draws from training data (cutoff August 2025). Compute-currency-specific features are derived from project spec in `.planning/PROJECT.md`. Confidence levels reflect this.

---

## Table Stakes

Features users expect from any financial dashboard. Missing = product feels incomplete or unreadable. Judges evaluating the demo will unconsciously expect these conventions.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Asset balance cards (CAU, SCU, CC) | Every banking dashboard shows balances front-and-centre. Primary information hierarchy. | Low | Three cards, one per asset class. Use shadcn `Card`. Show unit label prominently (not just number). |
| Balance sign / direction indicator | Users must know at a glance if they're positive or negative. Red/green colouring is a universal convention. | Low | CC must show negative clearly. Use red text + negative sign + distinct background tint. |
| Transaction / lease history table | Every fintech product has a chronological list of what happened. Infinite scroll or paginated. | Low–Med | Mocked data. Columns: timestamp, type (lease/transfer/credit), counterparty, amount, status. |
| Current period summary | "This period" spending vs earning. Gives temporal context. | Low | Could be a subtitle under each balance card (e.g., "+412 SCU earned this cycle"). |
| Status indicators / badges | Active, expired, pending, overdue — fintech dashboards rely on semantic badges. | Low | Use shadcn `Badge` with colour variants. Reusable across leases table and history table. |
| Empty / zero state handling | When there are no active leases, no history, etc. — blank screens feel broken. | Low | Placeholder copy + illustration or icon. Not hard to do, but easy to forget. |
| Loading states | Skeleton loaders for cards and charts while mocked data "loads". Makes demo feel live. | Low | shadcn skeleton primitives. Even a 300ms artificial delay + skeleton improves believability. |
| Responsive layout (desktop-first) | Judges will view on laptops. Layout must not break at 1280–1440px viewport. | Low | Single breakpoint concern. Not mobile-responsive, per scope. |
| Navigation / sidebar | Users need to move between Dashboard, History, and the Send/Lend flow. | Low | shadcn sidebar or simple top nav. Three routes maximum. |

---

## Differentiators

Features specific to the compute-currency world that make this demo compelling and memorable. These are what separate ComputeBank from a generic finance clone.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| Active leases Gantt panel | Time-limited leases are the core mechanic. Visualising them as horizontal progress bars with live countdowns communicates the urgency of this economy instantly. | Med | One row per active lease. Bar fills left-to-right representing elapsed time. Colour transitions: green (>50% remaining) → yellow (20–50%) → pulsing red (<20%). Uses CSS animation or Framer Motion for pulse. |
| Live countdown timers per lease | Real-time ticking countdown ("expires in 4h 12m 33s") makes expiry feel visceral, not abstract. | Med | Use `setInterval` updating every second. Format as HH:MM:SS or "Xd Xh Xm". Critical for demo drama. |
| SCU allocation donut / stacked area | Four-state breakdown (available / consumed / reserved / leased) shows where SCU is at a glance. Makes the leasing economy tangible. | Med | Recharts `PieChart` or `AreaChart`. Colour-coded segments. Tooltip on hover with exact units. |
| SCU depletion forecast line | "You will hit zero at 14:32 tomorrow" is the most urgent signal in this economy. A projected line on the balance chart is a killer demo moment. | Med–High | Requires computing burn rate from mocked transactions. Recharts `ReferenceLine` or dashed extension line on the area chart. Confidence interval band optional but impressive. |
| CC balance history chart (below-zero) | Line chart that crosses zero into negative territory with a red fill below the axis. Visually communicates debt without any text needed. | Med | Recharts `AreaChart` with `defs` gradient — positive area tinted blue/green, negative area tinted red. This is a non-trivial Recharts customisation. |
| Debt state UI mode | When CC < 0 and active leases remain, the dashboard shifts into a distinct visual state: warning banner, red accents, possible "at risk" badge on affected leases. | Med | Conditional CSS class on root layout or a context flag. Affects multiple components. Do not make it subtle — it must be immediately legible. |
| Pulsing / animated urgency alerts | Near-expiry leases trigger animated alerts (pulsing red border, toast notification, or alert banner). This is the emotional peak of the demo. | Low–Med | CSS `@keyframes pulse` or Tailwind `animate-pulse`. shadcn `Alert` component for banner. Should auto-dismiss or persist — pick one consistently. |
| CAU yield rate display | Showing "CAU generating X SCU/hour" makes the CAU → SCU relationship legible. Grounds the economy's logic. | Low | Derived stat. Static or slowly animated counter. Reinforces that CAU is productive capital, not just a number. |
| Lease counterparty display | Showing who you leased to / borrowed from makes the economy feel networked even in a single-user demo. | Low | Mocked usernames (e.g., "node-cluster-7", "warehouse-grid-alpha"). Adds worldbuilding texture. |
| Send / Lend SCU flow | An interactive form to initiate a compute loan. Validates that SCU available > amount requested, sets duration, previews the resulting lease Gantt bar before confirming. | High | Multi-step form or modal. shadcn `Dialog` + `Form` + `Input`. Requires form state management (react-hook-form already in shadcn). The "preview" step is highest complexity. |

---

## Anti-Features

Things to deliberately NOT build for this hackathon. Each has a reason and a suggested alternative.

| Anti-Feature | Why Avoid | What to Do Instead |
|--------------|-----------|-------------------|
| Real authentication / login screen | Adds zero demo value; wastes hours on auth boilerplate; out of scope per PROJECT.md | Hard-code a single mocked user. Show avatar + username in header. |
| WebSocket / real-time backend | Not needed; frontend timers are sufficient; adds infra complexity | `setInterval` on the client for countdown timers. Mocked data via a local JSON file or inline constants. |
| Multi-user P2P view | Out of scope. Would require backend, state sync, and socket infra. | Show counterparty names as mocked strings only. |
| Mobile responsive layout | Judges use laptops. Time spent on mobile is time not spent on visualisation polish. | Set a min-width of ~1024px. Let it clip below that. |
| Settings / profile editing | No functional value for demo. | Static placeholder route or omit entirely. |
| Notification system / email alerts | Backend dependency, no demo payoff | Single in-app alert banner using shadcn `Alert` is enough. |
| Historical data export (CSV/PDF) | Engineering effort with no visual demo payoff | Omit. If pressed, show a disabled "Export" button as future-state signalling. |
| Currency conversion / exchange UI | Not in the compute-currency model per PROJECT.md | The three asset classes have defined relationships (CAU → SCU → CC). No exchange mechanic exists. |
| Onboarding / tutorial flow | Judges already understand they're watching a demo. | Put a single sentence of worldbuilding copy in the dashboard header or sidebar. |
| Dark mode toggle | Nice to have, not differentiating. shadcn supports it but wiring a toggle correctly costs time. | Pick one mode (dark recommended for visual drama) and commit. |

---

## Feature Dependencies

```
CAU balance card
  └─ CAU yield rate display (derived: CAU × rate/hour = SCU earned)

SCU allocation donut
  └─ Active leases Gantt panel (lease data feeds both)
       └─ Live countdown timers (per lease record)
       └─ Pulsing urgency alerts (triggered from countdown state)
       └─ Debt state UI mode (triggered when CC < 0 AND active leases exist)

SCU depletion forecast line
  └─ SCU allocation donut (needs available SCU + burn rate)
  └─ CC balance history chart (shares the time-series chart area)

Send / Lend SCU flow
  └─ SCU allocation donut (validates available SCU before submit)
  └─ Active leases Gantt panel (new lease appears here post-submit)

CC balance history chart
  └─ Debt state UI mode (CC < 0 triggers debt mode across dashboard)

Transaction / lease history table
  └─ Active leases Gantt panel (same lease records, different view)
```

---

## MVP Recommendation

**Prioritise (ship these first):**

1. Asset balance cards (CAU, SCU, CC) with sign/colour — establishes the world immediately
2. Active leases Gantt panel with countdown timers — the most dramatic and unique visual
3. SCU allocation donut — grounds the economy's mechanics
4. Debt state UI mode — makes the CC < 0 scenario visually legible
5. Pulsing urgency alerts — the emotional peak, and easy relative to its impact
6. Transaction / lease history table — baseline fintech credibility

**Build second (high-value, moderate complexity):**

7. CC balance history chart with below-zero red fill — visual tour de force, non-trivial Recharts work
8. SCU depletion forecast line — killer demo moment, needs burn rate logic
9. CAU yield rate display — low effort, high worldbuilding value

**Build last if time allows:**

10. Send / Lend SCU flow — highest complexity, requires form + validation + state. Only attempt once everything above is polished.

**Defer / skip entirely:**

- All anti-features listed above

---

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Fintech table-stakes features | MEDIUM | Training data from banking dashboard conventions through Aug 2025. No live verification due to search/tool restrictions. Core conventions (balance cards, history table, status badges) are stable and well-established. |
| Compute-currency differentiators | HIGH | Derived directly from `.planning/PROJECT.md` requirements. These are spec-driven, not researched. |
| Anti-features | MEDIUM | Based on hackathon scope constraints in PROJECT.md + general fintech product knowledge. |
| Feature dependencies | HIGH | Derived from data model described in PROJECT.md. Logical dependencies, not speculative. |
| Complexity estimates | MEDIUM | Based on shadcn/Recharts ecosystem knowledge through Aug 2025. Recharts below-zero gradient is genuinely non-trivial — flag this for deeper research in the architecture phase. |

---

## Gaps to Address

- **Recharts below-zero gradient:** The CC history chart requires a Recharts `linearGradient` with a dynamic zero-crossing point. This is achievable but the implementation is non-trivial. The architecture/stack research phase should verify the exact approach with Recharts docs.
- **Gantt bar animation:** CSS `animate-pulse` (Tailwind) works for the pulsing red state, but smooth colour transitions (green → yellow → red) on the bar itself may require a computed style or CSS custom property approach. Needs implementation spike.
- **Burn rate calculation:** The SCU depletion forecast requires defining what "burn rate" means in the mocked data model. This is a data modelling decision, not a UI decision. Should be resolved when the mocked data schema is defined.
- **Send/Lend form scope:** If time is short, the Send/Lend flow can be reduced to a single-step form (no preview) without losing demo coherence. This is a build-time decision.

---

## Sources

- Project specification: `/Users/derricklim/Documents/GitHub/Quackathon-Seed.BAS/.planning/PROJECT.md`
- Fintech dashboard conventions: Training data (cutoff August 2025) — MEDIUM confidence, unverified in this session due to tool restrictions
- Recharts API: Training data (cutoff August 2025) — recommend verification against current Recharts docs before implementing below-zero gradient and reference line features
