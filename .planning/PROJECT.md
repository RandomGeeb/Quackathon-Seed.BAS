# ComputeBank

## What This Is

A banking dashboard app built with Next.js and shadcn/ui, set in an alternate universe where computing power has replaced traditional currency. Users manage three asset classes — CAU (Compute Asset Units), SCU (Standard Compute Units), and CC (Compute Credits) — and can lend or borrow processing power via time-limited leases visualised with live countdown timers.

## Core Value

The dashboard must make it immediately clear: how much compute you have, where it's going, and when it runs out — so users can act before they hit zero or go into debt.

## Requirements

### Validated

(None yet — ship to validate)

### Active

- [ ] Dashboard with asset overview cards for CAU, SCU, and CC balances
- [ ] SCU allocation breakdown (available / consumed / reserved / leased) as stacked area or donut chart
- [ ] Active leases panel — Gantt-style horizontal bars per lease with live countdown timers, colour-coded green → yellow → pulsing red
- [ ] SCU depletion forecast line — projected "hits zero at X" based on current burn rate
- [ ] CC balance history area chart — line goes below zero with red fill when in debt
- [ ] Transaction/lease history table
- [ ] Send/lend SCU flow (initiate a compute loan to another user)
- [ ] Debt state handling — UI communicates when CC is negative and compute obligations remain
- [ ] Aggressive urgency UI — pulsing/animated alerts for near-expiry leases

### Out of Scope

- Real backend / authentication — mocked data only for hackathon demo
- Multi-user simultaneous views — single user perspective only
- Mobile app — web dashboard only
- Real-time WebSocket data — simulated timers on the frontend are sufficient

## Context

- **Universe**: Computing power replaced fiat currency. CAU is the underlying asset (like hardware/property), SCU is the yield it produces over time (the spendable flow), CC is the liquid payment unit that allows debt.
- **CAU → SCU relationship**: CAU generates SCU at a rate over time (compute-to-compute per hour). This rate is the heartbeat of the economy.
- **SCU states**: Can be available, consumed, reserved, or leased to others. Leases have hard expiry timers — when a lease expires, that SCU capacity returns.
- **Debt scenario**: CC can go negative (debt). Users can also be "owed" future processing time. Both states must be visually distinct and urgent.
- **Hackathon context**: This is a Quackathon project. Ship a compelling demo dashboard with believable mocked data and polished visualisations.

## Constraints

- **Tech Stack**: Next.js + shadcn/ui — no deviation. Use Recharts (built into shadcn charts) for all visualisations.
- **Data**: Mocked/hardcoded data only — no backend, no auth required.
- **Timeline**: Hackathon pace — prioritise visual impact and core flows over completeness.
- **Scope**: Single user view. No real P2P connectivity needed.

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Dashboard as primary screen | Hero visualisation for judges/demo | — Pending |
| Recharts via shadcn charts | Already in shadcn ecosystem, no extra deps | — Pending |
| Mocked data | Hackathon speed, avoids backend complexity | — Pending |
| Aggressive urgency UI (pulsing red) | Compute expiry is the most dramatic moment in this world | — Pending |

---
*Last updated: 2026-03-21 after initialization*
