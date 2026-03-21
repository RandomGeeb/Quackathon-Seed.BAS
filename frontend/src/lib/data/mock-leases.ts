import type { Lease } from '@/types'

const NOW  = Date.now()
const MIN  = 60_000        // 1 minute in ms
const HOUR = 3_600_000     // 1 hour in ms

// ---------------------------------------------------------------------------
// MOCK_LEASES — Three active leases; one per urgency state
//
// lease-001: CRITICAL — NovaTech Systems
//   Duration: ~8.07 hours total. 4 minutes remaining = 0.8% of total.
//   → Well below the 10% critical threshold. Renders pulsing red.
//
// lease-002: WARNING — Cluster-Omega
//   Duration: ~5.72 hours total. 1h42m remaining = ~29.7% of total.
//   → Between 10% and 50% → warning threshold. Renders yellow.
//
// lease-003: HEALTHY — Arch-Node-7 (inbound)
//   Duration: ~8.4 hours total. 6h24m remaining = ~76.2% of total.
//   → Above the 50% healthy threshold. Renders green.
//   Direction is 'inbound' — Aria is renting SCU from this node.
// ---------------------------------------------------------------------------
export const MOCK_LEASES: Lease[] = [
  {
    id:           'lease-001',
    counterparty: 'NovaTech Systems',
    scuAmount:    340_000,
    scuPerHour:   42_500,
    direction:    'outbound',
    startedAt:    NOW - 8 * HOUR - 4 * MIN,   // started ~8h04m ago
    expiresAt:    NOW + 4 * MIN,               // expires in 4 minutes
    // Duration: 8h08m total. Remaining: 4m / 488m = 0.82% → CRITICAL
  },
  {
    id:           'lease-002',
    counterparty: 'Cluster-Omega',
    scuAmount:    180_000,
    scuPerHour:   18_000,
    direction:    'outbound',
    startedAt:    NOW - 4 * HOUR,              // started 4h ago
    expiresAt:    NOW + 1 * HOUR + 42 * MIN,   // expires in 1h42m
    // Duration: 5h42m total. Remaining: 102m / 342m = 29.8% → WARNING
  },
  {
    id:           'lease-003',
    counterparty: 'Arch-Node-7',
    scuAmount:    820_000,
    scuPerHour:   82_000,
    direction:    'inbound',
    startedAt:    NOW - 2 * HOUR,              // started 2h ago
    expiresAt:    NOW + 6 * HOUR + 24 * MIN,   // expires in 6h24m
    // Duration: 8h24m total. Remaining: 384m / 504m = 76.2% → HEALTHY
  },
]
