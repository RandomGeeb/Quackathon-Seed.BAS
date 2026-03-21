import type { UrgencyLevel } from '@/types'

// ---------------------------------------------------------------------------
// Urgency threshold rules — LOCKED decision from CONTEXT.md
// Based on percentage of total lease duration remaining (not absolute time).
// >50% remaining  → healthy (green)
// 10–50% remaining → warning (yellow)
// <10% remaining  → critical (pulsing red)
// ≤0 ms remaining → expired (neutral)
// ---------------------------------------------------------------------------
export const URGENCY_THRESHOLDS = {
  healthy: 0.5,   // > this ratio → healthy
  warning: 0.1,   // > this ratio (and ≤ healthy) → warning; < this ratio → critical
} as const

// ---------------------------------------------------------------------------
// URGENCY_CLASSES — Full Tailwind class string for text + background + border
// Import this in: asset cards (Phase 2), CC balance indicator (Phase 4)
// Never hardcode hex values — always import from this file.
// animate-urgency-pulse is defined in globals.css @theme/@keyframes (Plan 01).
// ---------------------------------------------------------------------------
export const URGENCY_CLASSES: Record<UrgencyLevel, string> = {
  healthy:  'text-green-500  bg-green-500/10  border-green-500/20',
  warning:  'text-yellow-400 bg-yellow-400/10 border-yellow-400/20',
  critical: 'text-red-500    bg-red-500/10    border-red-500/20 animate-urgency-pulse',
  expired:  'text-neutral-500 bg-neutral-500/10 border-neutral-500/20',
}

// ---------------------------------------------------------------------------
// URGENCY_BAR_CLASSES — Background-only class for Gantt bar fills (Phase 4)
// Text and border not included — bar fill only.
// ---------------------------------------------------------------------------
export const URGENCY_BAR_CLASSES: Record<UrgencyLevel, string> = {
  healthy:  'bg-green-500',
  warning:  'bg-yellow-400',
  critical: 'bg-red-500 animate-urgency-pulse',
  expired:  'bg-neutral-600',
}

// ---------------------------------------------------------------------------
// URGENCY_TEXT_COLORS — Raw Tailwind text color class for inline use
// Use when only the text color is needed (e.g., countdown timer text).
// ---------------------------------------------------------------------------
export const URGENCY_TEXT_COLORS: Record<UrgencyLevel, string> = {
  healthy:  'text-green-500',
  warning:  'text-yellow-400',
  critical: 'text-red-500',
  expired:  'text-neutral-500',
}

// ---------------------------------------------------------------------------
// getUrgencyLevel — Pure derivation function
// Given ms remaining and total ms duration, returns the urgency level.
// Both parameters required — percentage-based rule (CONTEXT.md locked decision).
//
// Usage: getUrgencyLevel(lease.expiresAt - Date.now(), lease.expiresAt - lease.startedAt)
// ---------------------------------------------------------------------------
export function getUrgencyLevel(msRemaining: number, msTotal: number): UrgencyLevel {
  if (msRemaining <= 0) return 'expired'
  const ratio = msRemaining / msTotal
  if (ratio < URGENCY_THRESHOLDS.warning) return 'critical'   // < 10% → critical
  if (ratio < URGENCY_THRESHOLDS.healthy) return 'warning'    // 10–50% → warning
  return 'healthy'                                            // > 50% → healthy
}
