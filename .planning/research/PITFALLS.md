# Domain Pitfalls

**Domain:** Fintech / banking dashboard — Next.js + shadcn/ui + Recharts, hackathon context
**Project:** ComputeBank
**Researched:** 2026-03-21
**Confidence:** MEDIUM (training data, React/Next.js ecosystem well-established; hackathon-specific patterns from author experience; web search unavailable during this session)

---

## Critical Pitfalls

Mistakes that cause rewrites, demo failures, or judges writing off the project.

---

### Pitfall 1: setInterval Memory Leaks in Countdown Timers

**What goes wrong:**
Each lease card mounts a `setInterval` to tick down its countdown. If the cleanup function in `useEffect` is missing or incorrect, intervals keep running after the component unmounts or after a React Strict Mode double-invoke. With N active leases, you silently accumulate N * 2 (or more) intervals. The dashboard appears to run fine during development but becomes janky after navigating away and back, or crashes the tab during a demo.

**Why it happens:**
```tsx
// WRONG — no cleanup
useEffect(() => {
  setInterval(() => setTimeLeft(t => t - 1), 1000);
}, []);

// WRONG — cleanup uses stale id reference
useEffect(() => {
  let id = setInterval(() => setTimeLeft(t => t - 1), 1000);
  return () => clearInterval(id); // correct form but...
}, [leaseId]); // re-runs when leaseId changes — old interval not cancelled if leaseId identity is unstable
```

**Consequences:**
- Multiple intervals firing simultaneously — countdown digits skip or flicker
- CPU/memory climbing over time — visible in DevTools during demo
- React Strict Mode (default in Next.js dev) double-mounts every component, so every missing cleanup fires twice immediately

**Prevention:**
- Always return a cleanup from every `useEffect` that creates a timer
- Hoist shared tick logic into a single top-level interval (one `setInterval` in a context or parent component) that derives all countdowns from `Date.now()` subtraction rather than decrementing per-lease state
- Prefer `Date`-based remaining time (`expiresAt - Date.now()`) over an accumulated counter — this is drift-free and naturally stops when it hits zero without needing to clear the interval

```tsx
// CORRECT pattern — single tick, derived values
function useCountdown(expiresAt: number) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []); // one interval, stable dependency array
  return Math.max(0, expiresAt - now);
}
```

**Detection:**
- Open DevTools Performance tab and watch CPU during navigation
- In React Strict Mode, each timer fires twice in dev — if you see double-speed countdowns, cleanup is missing
- `console.count('tick')` in the interval callback — should print once per second per component, not accelerating

**Phase:** Address in the lease timers component (Active Leases panel). Fix before any visual polish on that panel.

---

### Pitfall 2: Recharts Re-Rendering the Entire Chart on Every Tick

**What goes wrong:**
Any state change in a parent component (including the 1-second timer tick) causes Recharts charts to re-render and re-animate from scratch. The SCU area chart and CC history chart will visibly "reset" their animations every second if they share state scope with a ticking timer.

**Why it happens:**
Recharts rerenders whenever its props change. If chart data or the component tree above the chart re-renders (e.g., because a timer tick updates a parent component's state), Recharts performs a full repaint including its built-in entry animation.

**Consequences:**
- Charts visibly flash or re-animate every second during the demo
- CPU spikes on each tick — performance tab shows chart layout recalculations
- `isAnimationActive` defaults to `true` in Recharts; judges will notice the stuttering

**Prevention:**
- Isolate timer state from chart data. Timer state lives in leaf components (lease cards) or a dedicated timer context. Chart components receive only stable, memoized data props.
- Wrap chart components in `React.memo` with a stable props comparator
- Set `isAnimationActive={false}` on all Recharts series components (`<Area>`, `<Line>`, `<Bar>`) — animation on a live-data dashboard looks broken, not polished
- Memoize the data arrays passed to charts with `useMemo`; only recompute when the underlying mock data actually changes (which for a hackathon is never, or only on explicit user action)

```tsx
// Prevent chart re-render on timer tick
const chartData = useMemo(() => buildSCUHistory(mockLeases), [mockLeases]);

const SCUChart = React.memo(({ data }) => (
  <AreaChart data={data}>
    <Area type="monotone" dataKey="value" isAnimationActive={false} />
  </AreaChart>
));
```

**Detection:**
- Add `console.log('chart render')` inside the chart component — if it logs every second, the isolation is broken
- React DevTools Profiler: record 5 seconds of idle — chart components should not appear in the flame graph

**Phase:** Architecture decision in the first chart implementation phase. Setting `isAnimationActive={false}` and `React.memo` should be applied at chart-creation time, not retrofitted.

---

### Pitfall 3: Mocked Data That Looks Obviously Fake

**What goes wrong:**
Mock data is generated with round numbers, uniform timestamps (e.g., exactly 1 hour apart), identical transaction amounts, and no variance. Judges immediately read the dashboard as a prototype skeleton rather than a real product. The "alternate universe compute economy" narrative collapses.

**Why it happens:**
Developers think about mock data as a technical placeholder rather than a product asset. A `balance: 1000` entry is technically fine for wiring up a component but kills the demo's credibility.

**Consequences:**
- Judges mentally discount the demo as unfinished
- The urgency UX (near-expiry leases, debt state) cannot be demonstrated unless mock data includes those edge cases
- The lore of the compute economy (CAU generating SCU over time, CC debt) is unconvincing

**Prevention:**
- Treat mock data as a curated demo script, not random test fixtures
- Use non-round, slightly irregular numbers: `SCU: 4_847.3`, not `SCU: 5000`
- Include at least one lease in each urgency state: one at > 1 hour, one at < 10 minutes (yellow), one at < 2 minutes (pulsing red)
- Include one negative CC balance scenario or a toggle to switch into debt state for the demo
- Stagger timestamps with slight irregularity: transactions at 9:03, 9:47, 11:12 rather than 9:00, 10:00, 11:00
- Include 2–3 different counterparty "users" (UserIDs) in transaction history so the table looks like real activity
- The SCU depletion forecast line should end at a specific future datetime (e.g., "depletes in 18h 42m") rather than a round number

**Detection:**
- Read the mock data aloud as if you were a judge. If any number sounds like a placeholder ("100", "1000", "test-user-1"), replace it.
- Show the dashboard to someone unfamiliar with the project. Their first question should be about the product, not "is this real data?"

**Phase:** Mock data design should happen before any UI is built, so the full urgency spectrum is exercisable from day one.

---

### Pitfall 4: Debt / Negative Balance States Treated as an Afterthought

**What goes wrong:**
The CC balance history chart renders a negative value as a line going below the x-axis, but the chart area is white or the default blue fill — it looks like a bug, not a designed state. No visual distinction signals that being below zero means debt and has consequences.

**Why it happens:**
Recharts `<Area>` fill is a single color by default. Implementing a conditional fill (positive = brand color, negative = red) requires a `<defs><linearGradient>` trick that is non-obvious and easy to skip under time pressure.

**Consequences:**
- The most dramatic feature of the product ("CC goes into debt") looks like a rendering error during the demo
- Judges who notice the negative value but see no visual treatment assume the developer didn't finish it

**Prevention:**
- Use a gradient stop at the zero-crossing point to split the fill: above zero uses the brand fill, below zero uses a red fill
- This is a known Recharts pattern using `<linearGradient>` with `gradientUnits="userSpaceOnUse"` and computed stop offsets based on data min/max
- Additionally show a debt alert banner above the chart when CC < 0, and change the CC balance card's number color to red with a "DEBT" badge

```tsx
// Recharts gradient zero-crossing pattern
const yMin = Math.min(...data.map(d => d.cc));
const yMax = Math.max(...data.map(d => d.cc));
const zeroOffset = yMax / (yMax - yMin); // fraction where y=0 falls

<defs>
  <linearGradient id="ccGradient" x1="0" y1="0" x2="0" y2="1"
    gradientUnits="userSpaceOnUse" y1={yMax} y2={yMin}>
    <stop offset={zeroOffset} stopColor="#22c55e" stopOpacity={0.4} />
    <stop offset={zeroOffset} stopColor="#ef4444" stopOpacity={0.4} />
  </linearGradient>
</defs>
<Area fill="url(#ccGradient)" ... />
```

**Detection:**
- Manually set the CC mock data to include negative values before any other work on the chart. Design for debt from the first render.

**Phase:** CC history chart implementation. Debt state is a first-class requirement, not a v2 enhancement — build the gradient in at chart creation.

---

### Pitfall 5: Hackathon Scope Creep Killing Core Demo Quality

**What goes wrong:**
The team adds a "send/lend SCU" flow, a settings page, and a notification system — and ships a demo where the main dashboard looks unpolished because time ran out. Judges see incomplete polish on the hero screen and half-built secondary features.

**Why it happens:**
Each feature feels small in isolation. The send/lend flow seems like "just a modal." The cumulative time cost of secondary features is invisible until 2 hours before the deadline.

**Consequences:**
- Hero dashboard has layout issues that weren't caught
- Urgency animations (pulsing red) were never finished
- The depletion forecast line is a straight line with no label
- Judges judge what they see on screen; secondary flows they never click are invisible credit

**Prevention:**
- Lock the demo path on day one: define the exact 3-minute walkthrough a judge will take. Every feature not on that path is deferred.
- "Done" for hackathon means: visible on the demo path, polished, and exercisable with mock data
- The send/lend modal is useful but NOT the hero — finish the dashboard first, then add flows if time remains
- Use a physical or written "demo script" card. If a feature isn't in the script, it isn't a priority.

**Detection:**
- Ask "can I demo this right now?" every 2 hours. If the answer is no for the core dashboard, stop adding features.

**Phase:** Planning/scoping. The roadmap itself should order: (1) core dashboard layout, (2) charts, (3) timers, (4) urgency animations, (5) send/lend flow — in that strict priority.

---

## Moderate Pitfalls

---

### Pitfall 6: CSS Animation Conflicts with Tailwind and shadcn Utility Classes

**What goes wrong:**
The "pulsing red" urgency animation for near-expiry lease bars is implemented with custom CSS `@keyframes pulse-red`, but Tailwind already ships a `animate-pulse` utility. When both are applied, the animation timing fights itself. Or the developer uses `animate-pulse` (which pulses opacity) when the requirement is a background-color pulse between orange and red — a different animation entirely.

**Prevention:**
- Define urgency animations explicitly in `globals.css` as named keyframes. Do not rely on Tailwind's `animate-pulse` for color-pulsing behavior.
- Keep animation classes on a wrapper element, not on text children, to avoid opacity conflicts with text legibility.
- Test the animation at 0.5x speed in DevTools to verify it looks intentional.

---

### Pitfall 7: Recharts Tooltip Overflow Outside Viewport on Small Screens

**What goes wrong:**
The default Recharts tooltip renders inline and clips or overflows the card boundary when the user hovers near the right edge of a chart. During a live demo on a laptop screen, tooltips for the rightmost data points are cut off.

**Prevention:**
- Pass `position={{ x: 'auto', y: 'auto' }}` and use `wrapperStyle={{ zIndex: 1000 }}` on `<Tooltip>`
- Or use a custom tooltip component rendered outside the SVG (portal-based) for production quality
- For a hackathon: test hover behavior at the chart's rightmost point before the demo

---

### Pitfall 8: Gantt-Style Lease Bars Not Scaling to Time Range

**What goes wrong:**
The lease bar widths are hardcoded as percentages rather than computed from `(leaseEnd - leaseStart) / totalRange`. This means all bars look the same length regardless of actual duration. The visual is pretty but conveys no information.

**Prevention:**
- Compute bar width and left offset from the actual `startAt`/`expiresAt` fields on each lease object
- Define a fixed "view window" (e.g., the next 24 hours) and scale all positions relative to it
- This is a 20-minute implementation, not a complex feature — do it correctly the first time

---

### Pitfall 9: shadcn Card Components Not Aligning in the Dashboard Grid

**What goes wrong:**
The three asset overview cards (CAU, SCU, CC) use different content heights, causing the grid row to be uneven. The CAU card is taller than the CC card because one has a subtitle and the other doesn't.

**Prevention:**
- Wrap cards in a `grid grid-cols-3` container with `items-stretch`
- Use `h-full` on the `<Card>` component so all cards in a row stretch to the tallest sibling
- Decide on a fixed minimum height for overview cards in the first layout pass

---

## Minor Pitfalls

---

### Pitfall 10: Next.js App Router "use client" Scope Too Wide

**What goes wrong:**
The entire dashboard page file is marked `"use client"` to support `useState` for one small interactive element. This disables server-side rendering for the entire page and loses any SEO/performance benefit (less critical for a hackathon, but causes confusing hydration warnings).

**Prevention:**
- Push `"use client"` down to the smallest component that actually needs it (the countdown timer component, the send/lend modal trigger)
- Static sections (header, asset cards showing mocked data) can remain server components

---

### Pitfall 11: Hardcoded Color Strings Instead of Tailwind/shadcn Theme Tokens

**What goes wrong:**
Urgency states (green/yellow/red) are implemented with inline style `backgroundColor: '#ef4444'` rather than Tailwind classes. When the shadcn theme is customized or dark mode is toggled, urgency colors break.

**Prevention:**
- Use semantic Tailwind classes: `bg-green-500`, `bg-yellow-400`, `bg-red-500` for urgency states
- Define a utility map: `const urgencyClass = { ok: 'bg-green-500', warning: 'bg-yellow-400', critical: 'bg-red-500 animate-pulse' }`

---

### Pitfall 12: Console Errors from Recharts on SSR in Next.js App Router

**What goes wrong:**
Recharts uses browser-only APIs (`window`, `ResizeObserver`). In Next.js App Router, components that are not explicitly `"use client"` attempt SSR, which throws hydration mismatches or `window is not defined` errors.

**Prevention:**
- Every component that contains a Recharts chart must be `"use client"` or dynamically imported with `ssr: false`
- Dynamic import is preferable if the chart is in an otherwise-server component:

```tsx
const SCUChart = dynamic(() => import('./SCUChart'), { ssr: false });
```

---

## Phase-Specific Warnings

| Phase Topic | Likely Pitfall | Mitigation |
|-------------|----------------|------------|
| Mock data setup | Round numbers, missing urgency states | Design mock data as a demo script; include all states upfront |
| Active Leases panel | setInterval memory leaks (Pitfall 1) | Use single top-level tick with `Date.now()`-based derivation |
| Active Leases panel | Gantt bars all same width (Pitfall 8) | Compute width from actual time range on first implementation |
| SCU / CC charts | Recharts re-renders on timer tick (Pitfall 2) | `React.memo` + `isAnimationActive={false}` from the start |
| CC history chart | Debt state looks like a bug (Pitfall 4) | Gradient zero-crossing on first chart implementation |
| Send/lend SCU flow | Scope creep pushes dashboard polish out (Pitfall 5) | Build complete core dashboard before any secondary flows |
| Urgency animations | CSS conflicts with Tailwind animate (Pitfall 6) | Use custom `@keyframes` for color-pulse, not `animate-pulse` |
| Next.js app setup | Recharts SSR crash (Pitfall 12) | Dynamic import with `ssr: false` from the moment charts are added |
| Dashboard grid layout | Uneven card heights (Pitfall 9) | `items-stretch` + `h-full` on all overview cards |

---

## Sources

- React documentation on `useEffect` cleanup: https://react.dev/reference/react/useEffect#usage (HIGH confidence — official docs)
- Recharts `isAnimationActive` prop and `<Area>` API: https://recharts.org/en-US/api/Area (HIGH confidence — official docs)
- Recharts gradient zero-crossing pattern: MEDIUM confidence — established community pattern in Recharts GitHub issues and Stack Overflow, not in official docs directly
- Next.js App Router `"use client"` boundary guidance: https://nextjs.org/docs/app/building-your-application/rendering/client-components (HIGH confidence — official docs)
- Next.js dynamic import with `ssr: false`: https://nextjs.org/docs/pages/building-your-application/optimizing/lazy-loading#with-no-ssr (HIGH confidence — official docs)
- Hackathon scope creep / demo quality patterns: MEDIUM confidence — author experience and community post-mortems; no single authoritative source
- shadcn/ui Card and grid alignment: MEDIUM confidence — shadcn component behavior documented at https://ui.shadcn.com/docs/components/card
