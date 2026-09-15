# BAS — Compute Economy Simulation

BAS is an agent-based economy for a fictional compute market, winning University of Dundee's Quakathon. A **FastAPI** simulation engine runs ~150 autonomous economic agents (individuals, small corporations, large businesses) trading **SCU** (Standard Compute Units) against **CC** (Compute Credits) on a tick-driven clock, while random events, shortages, and volatility shocks push the market around. A **Next.js** frontend visualizes the whole thing in real time — live pricing, wealth concentration, a stock market, a GPU/CPU/RAM hardware inventory with an interactive 3D viewer, and a set of "consumer" pages (swap, payment, loans) built on top of it.

## Simulation Demo:


https://github.com/user-attachments/assets/0d7e4ede-741d-4cd3-ba0f-9ab0524b01cd



## What it does

- Simulates a compute-resource economy tick by tick (default every 2 seconds): agents assess their own liquidity stress, react to price trends and shortages, and place buy/sell orders that clear into a new SCU price.
- Spawns random macro/micro market events (confidence shocks, panic hoarding, liquidity vacuums, speculative chatter, …) that bias supply, demand, volatility, and agent stress for a window of ticks.
- Runs a separate synthetic stock market alongside the SCU economy, with per-stock regimes, momentum, mean-reversion, and breakout/crash behaviour.
- Tracks full history — tick-by-tick metrics, trades, entity state — so the frontend can chart price dynamics, wealth inequality (Gini coefficient, top-1%/top-10% share), and market stress over time.
- Lets you queue manual actions (transfer CC, buy/sell SCU or stocks, withhold inventory, liquidate, trigger a custom event) that apply deterministically on the next tick.
- Supports a full **market reset** — wipe every entity, trade, and history table and reseed a fresh economy at tick 0.
- Renders an interactive 3D GPU model (drag to rotate, scroll to zoom) inside the hardware inventory page.

## Architecture

```
Quackathon-Seed.BAS/
├── Backend/                 FastAPI simulation engine + REST API
│   └── app/
│       ├── main.py          App entrypoint, CORS, router wiring, lifespan (starts the tick loop)
│       ├── db.py            SQLite schema + connection handling (WAL mode, FKs on)
│       ├── config.py        Settings (tick length, entity count, base price, …)
│       ├── seed.py          Initial world seeding (entities + listed stocks)
│       ├── sim/
│       │   ├── engine.py    The tick loop: events → actions → production → market clearing → stress/wealth update
│       │   ├── agents.py    Per-entity behavioural model (mode selection, order sizing)
│       │   ├── events.py    Event catalogue, spawning, and expiry
│       │   └── stocks.py    Synthetic equities market simulation
│       └── api/
│           ├── world.py     World/market snapshots, entity + event listings
│           ├── stocks.py    Stock listings, history, per-entity holdings
│           ├── actions.py   Manual action queueing (buy/sell/transfer/liquidate)
│           ├── history.py   Tick metrics + trade history
│           └── admin.py     Event injection, full world reset
│
└── BAS/                      Next.js 16 / React 19 frontend
    ├── app/
    │   ├── dashboard/        Overview + SCU usage charts
    │   ├── cau/              Hardware (GPU/CPU/RAM) inventory + 3D viewer
    │   ├── sim/              Live economy monitor (price, wealth, stress, rich list) + Reset Market
    │   ├── stocks_market/    Synthetic stock market view
    │   ├── entities-live/    Live entity browser
    │   ├── swap/ payment/    Mock CC ↔ SCU swap and payment flows
    │   └── history/          Transaction history
    ├── components/           shadcn/ui + Radix primitives, sidebar, GPU viewer modal (react-three-fiber)
    └── lib/                  Mock data, reactive store, utils
```

## Tech stack

**Frontend** — TypeScript, React 19, Next.js 16 (App Router, Turbopack), Tailwind CSS v4, shadcn/ui + Radix UI, Recharts, Three.js via `@react-three/fiber` + `@react-three/drei`.

**Backend** — Python 3.13, FastAPI, Pydantic, SQLite (raw `sqlite3`, WAL mode), `asyncio` tick loop.

## Running it locally

### Backend

```bash
cd Backend
py -3.13 -m pip install fastapi uvicorn pydantic   # one-time
mkdir -p data                                       # one-time, only if it doesn't exist
py -3.13 -m uvicorn app.main:app --reload --port 8000
```

- API: `http://127.0.0.1:8000`
- Interactive docs: `http://127.0.0.1:8000/docs`
- On first run the database auto-seeds ~150 entities and a set of listed stocks, then the tick loop starts advancing the economy every `tick_seconds` (2s by default).

> Requires **Python 3.13** — if your default `python` is older, install/use 3.13 explicitly (`py -3.13` on Windows).

### Frontend

```bash
cd BAS
npm install
npm run dev
```

- App: `http://localhost:3000`

Start the backend first — the frontend pages fetch live data from `http://127.0.0.1:8000/api` on load and poll it on an interval.

## Resetting the simulation

The economy can be reset to a clean tick-0 state at any time:

- **From the UI:** open the Sim Monitor (`/sim`) and click **Reset Market** in the status bar. It confirms before wiping anything, then reseeds automatically.
- **Directly against the API:**
  ```bash
  curl -X POST http://127.0.0.1:8000/api/admin/reset
  ```

Reset wipes every entity, trade, event, and history table, resets the tick counter and SCU price to their defaults, and reseeds a fresh set of entities and stocks — all while the tick loop keeps running underneath it.

## Notes

- The frontend's swap/payment/loan pages currently run on mock client-side data ([lib/mock-data.ts](BAS/lib/mock-data.ts), [lib/store.tsx](BAS/lib/store.tsx)) rather than the live backend — the sim monitor, stock market, and CAU inventory pull real data from FastAPI.
- CORS on the backend is currently scoped to `localhost:3000` / `localhost:3001` for local development.
