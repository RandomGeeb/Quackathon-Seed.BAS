# Roadmap: ComputeBank

## Overview

ComputeBank ships as a five-phase hackathon dashboard. The foundation (types, mock data, shell) is built first so every subsequent phase snaps into place cleanly. The asset card header comes next for an early "real data on screen" moment. The two hero visualisations — the SCU Activity Monitor chart and the Active Leases Gantt panel with live countdown timers — occupy the centre of the roadmap and receive the most attention. Action flows (Send/Lend, Swap, Add) close the demo loop. Every phase delivers something a judge can see and point at.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [ ] **Phase 1: Foundation** - Next.js shell, TypeScript types, mock demo script, urgency colour constants
- [ ] **Phase 2: Asset Header** - Dashboard header with CAU/SCU/CC balance cards, action button row
- [ ] **Phase 3: Hero Charts** - SCU Activity Monitor chart, CC transaction list, SCU warning background
- [ ] **Phase 4: Active Leases** - Gantt panel with live countdown timers, urgency transitions, debt indicators
- [ ] **Phase 5: Action Flows** - Send/Lend SCU modal, Swap modal, Add CAU modal

## Phase Details

### Phase 1: Foundation
**Goal**: The app is runnable, typed, and contains a realistic demo script that exercises every urgency state
**Depends on**: Nothing (first phase)
**Requirements**: FOUND-01, FOUND-02, FOUND-03, FOUND-04
**Success Criteria** (what must be TRUE):
  1. `npm run dev` starts without errors and the dashboard route renders at `/`
  2. TypeScript types exist for CAU, SCU, CC, Lease, and Transaction — importing them in any component does not error
  3. Mock data contains at least one lease in each state (healthy, warning, critical) and a negative CC balance
  4. All urgency colours (green, yellow, pulsing red) are drawn from a single shared constants file — no hardcoded hex values anywhere
**Plans**: TBD

### Phase 2: Asset Header
**Goal**: The dashboard header communicates the user's financial position at a glance — balances, states, and quick actions
**Depends on**: Phase 1
**Requirements**: ASSET-01, ASSET-02, ASSET-03, ASSET-04
**Success Criteria** (what must be TRUE):
  1. Dashboard header shows Total CC balance in Revolut-style format (e.g. "$150,100")
  2. Dashboard header shows Total SCU in available/total format (e.g. "1.1B / 100B")
  3. CC card renders with a red debt indicator when CC balance is negative
  4. Add, Swap, and Transfer buttons are visible below the cards and each opens or navigates to its respective flow
**Plans**: TBD

### Phase 3: Hero Charts
**Goal**: The SCU Activity Monitor chart makes compute flow legible — users can see allocation, production, and consumption at a glance
**Depends on**: Phase 2
**Requirements**: SCU-01, SCU-02, SCU-03, SCU-04, SCU-05, CC-01, CC-02, CC-03, DEBT-03
**Success Criteria** (what must be TRUE):
  1. The SCU panel shows a rolling line chart of available SCU over time with a Task Manager / Activity Monitor aesthetic
  2. A highlighted background band marks the CAU natural production threshold; the area above it is visually distinct (rented-in SCU)
  3. Sharp V-dip patterns appear on the chart when SCU is consumed or leased out
  4. The CC panel shows a Revolut-style transaction list with direction arrow, counterparty, CC amount, and timestamp per row
  5. When available SCU approaches zero (below CAU threshold), the SCU chart background shifts to a visual warning state
**Plans**: TBD

### Phase 4: Active Leases
**Goal**: The lease Gantt panel is the emotional core of the demo — timers count down in real time and urgency escalates visually
**Depends on**: Phase 3
**Requirements**: LEASE-01, LEASE-02, LEASE-03, LEASE-04, DEBT-01, DEBT-02
**Success Criteria** (what must be TRUE):
  1. The active leases panel shows one horizontal Gantt bar per active lease, scaled to actual time range
  2. Each lease bar has a live countdown timer that ticks in real time (seconds visible)
  3. Lease bars transition from green (>50% remaining) to yellow (10–50%) to pulsing red (<10%) without a page reload
  4. Each bar displays the counterparty name and SCU/hr rate as a label on the bar
  5. When CC balance is negative, the CC card and header display a red debt indicator distinct from the normal state
**Plans**: TBD

### Phase 5: Action Flows
**Goal**: Users can initiate the three core compute economy actions — lending, swapping, and buying — to close the demo loop
**Depends on**: Phase 4
**Requirements**: ACTION-01, ACTION-02, ACTION-03
**Success Criteria** (what must be TRUE):
  1. The Transfer flow lets the user select a counterparty, SCU amount, and duration and submit a compute loan
  2. The Swap flow shows the current CC/SCU rate and lets the user exchange one for the other
  3. The Add flow lets the user increase CAU capacity (buy more compute asset units)
**Plans**: TBD

## Progress

**Execution Order:**
Phases execute in numeric order: 1 → 2 → 3 → 4 → 5

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Foundation | 0/? | Not started | - |
| 2. Asset Header | 0/? | Not started | - |
| 3. Hero Charts | 0/? | Not started | - |
| 4. Active Leases | 0/? | Not started | - |
| 5. Action Flows | 0/? | Not started | - |
