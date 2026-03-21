# Requirements: ComputeBank

**Defined:** 2026-03-21
**Core Value:** The dashboard must make it immediately clear: how much compute you have, where it's going, and when it runs out.

## v1 Requirements

### Foundation

- [x] **FOUND-01**: App has Next.js App Router shell with navigation between Dashboard, Leases, and History pages
- [x] **FOUND-02**: TypeScript types defined for CAU, SCU, CC, Lease, and Transaction data shapes
- [x] **FOUND-03**: Mocked data is a staged demo script with all urgency states represented (healthy, warning, critical, debt)
- [x] **FOUND-04**: Shared urgency colour constants (green → yellow → pulsing red) used consistently across all components

### Asset Header

- [x] **ASSET-01**: Dashboard header shows Total CC balance card (e.g. "$150,100") in Revolut-style format
- [x] **ASSET-02**: Dashboard header shows Total SCU card with available/total format (e.g. "1.1B / 100B")
- [x] **ASSET-03**: CC card highlights in red when balance is negative (debt state)
- [x] **ASSET-04**: Action button row below cards: Add, Swap, Transfer — each navigates to or opens its respective flow

### SCU Chart (Activity Monitor Style)

- [ ] **SCU-01**: SCU panel shows a rolling line chart of available SCU over time (Activity Monitor / Task Manager aesthetic)
- [ ] **SCU-02**: Chart has a highlighted background band up to the CAU natural production threshold (what your hardware generates)
- [ ] **SCU-03**: Area above the CAU threshold band is visually distinct — represents rented-in SCU from others
- [ ] **SCU-04**: Line dips sharply when SCU is consumed or leased out (V-dip pattern is expected and meaningful)
- [ ] **SCU-05**: X-axis shows rolling timestamps; chart scrolls/updates to feel live

### CC Transaction List

- [ ] **CC-01**: CC panel shows a Revolut-style transaction list
- [ ] **CC-02**: Each row shows: direction arrow, counterparty name, CC amount, timestamp
- [ ] **CC-03**: List supports pagination ("load more")

### Active Leases Panel

- [ ] **LEASE-01**: Active leases panel below the two main charts shows one horizontal Gantt bar per active lease
- [ ] **LEASE-02**: Each lease bar has a live real-time countdown timer ticking in seconds
- [ ] **LEASE-03**: Lease bar colour transitions: green (>50% time remaining) → yellow (10–50%) → pulsing red (<10%)
- [ ] **LEASE-04**: Each lease bar shows counterparty name and SCU/hr rate as a label

### Action Flows

- [ ] **ACTION-01**: Transfer flow — user can initiate a compute loan: select counterparty, SCU amount, and duration
- [ ] **ACTION-02**: Swap flow — user can exchange CC for SCU (or SCU for CC) at a displayed rate
- [ ] **ACTION-03**: Add flow — user can increase CAU capacity (buy more compute asset units)

### Debt & Urgency States

- [ ] **DEBT-01**: When CC balance is negative, the CC card and header display a red debt indicator
- [ ] **DEBT-02**: When a lease is within 10% of expiry, it pulses red with an animated alert
- [ ] **DEBT-03**: When available SCU approaches zero (below CAU threshold), the SCU chart background shifts to a warning state

## v2 Requirements

### Enhanced Visualisation

- **VIS-01**: SCU depletion forecast — projected line showing when SCU hits zero at current burn rate
- **VIS-02**: CAU production rate sparkline — shows SCU generation rate over time
- **VIS-03**: CC balance history area chart — CC over time with red fill below zero

### Notifications

- **NOTF-01**: Toast alerts when a lease enters critical state (<10% time remaining)
- **NOTF-02**: Summary alert when CC balance crosses into negative

### Advanced Actions

- **ACTION-04**: Cancel/recall an active lease early
- **ACTION-05**: Extend an existing lease duration

## Out of Scope

| Feature | Reason |
|---------|--------|
| Real backend / auth | Mocked data only — hackathon scope |
| Multi-user live P2P | No real connectivity needed for demo |
| Mobile layout | Web dashboard only |
| Dark mode toggle | Dark mode is the default, no toggle needed |
| Real-time WebSocket | Simulated timers on frontend are sufficient |
| Currency exchange rate history | Out of scope for v1 |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| FOUND-01 | Phase 1 | Complete |
| FOUND-02 | Phase 1 | Complete |
| FOUND-03 | Phase 1 | Complete |
| FOUND-04 | Phase 1 | Complete |
| ASSET-01 | Phase 2 | Complete |
| ASSET-02 | Phase 2 | Complete |
| ASSET-03 | Phase 2 | Complete |
| ASSET-04 | Phase 2 | Complete |
| SCU-01 | Phase 3 | Pending |
| SCU-02 | Phase 3 | Pending |
| SCU-03 | Phase 3 | Pending |
| SCU-04 | Phase 3 | Pending |
| SCU-05 | Phase 3 | Pending |
| CC-01 | Phase 3 | Pending |
| CC-02 | Phase 3 | Pending |
| CC-03 | Phase 3 | Pending |
| LEASE-01 | Phase 4 | Pending |
| LEASE-02 | Phase 4 | Pending |
| LEASE-03 | Phase 4 | Pending |
| LEASE-04 | Phase 4 | Pending |
| ACTION-01 | Phase 5 | Pending |
| ACTION-02 | Phase 5 | Pending |
| ACTION-03 | Phase 5 | Pending |
| DEBT-01 | Phase 4 | Pending |
| DEBT-02 | Phase 4 | Pending |
| DEBT-03 | Phase 3 | Pending |

**Coverage:**
- v1 requirements: 23 total
- Mapped to phases: 23
- Unmapped: 0

---
*Requirements defined: 2026-03-21*
*Last updated: 2026-03-21 after roadmap creation — traceability confirmed*
