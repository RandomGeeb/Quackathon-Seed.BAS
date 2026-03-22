import json
import random
from app.config import settings
from app.db import db_cursor


INDIVIDUAL_STRATEGIES = ["steady", "cautious", "trend", "scarcity", "opportunist"]
SMALL_CORP_STRATEGIES = ["balanced", "reserve-heavy", "expansion", "reactive"]
LARGE_BIZ_STRATEGIES = ["stabilizer", "aggressive", "accumulator", "defensive"]


STOCK_SPECS = [
    {
        "ticker": "AURX",
        "name": "Aurora Compute",
        "archetype": "early_growth",
        "current_price": 18.0,
        "target_price": 58.0,
        "shares_outstanding": 100000.0,
        "base_drift": 0.002,
        "volatility": 0.018,
        "soft_floor": 8.0,
        "soft_ceiling": 72.0,
        "momentum_factor": 0.8,
        "mean_reversion_factor": 0.012,
        "breakout_chance": 0.01,
        "breakout_strength": 0.05,
        "crash_chance": 0.01,
        "crash_severity": 0.10,
        "dependency_json": [],
    },
    {
        "ticker": "VEST",
        "name": "Vestige Utility",
        "archetype": "stable_grind",
        "current_price": 32.0,
        "target_price": 42.0,
        "shares_outstanding": 120000.0,
        "base_drift": 0.0015,
        "volatility": 0.008,
        "soft_floor": 22.0,
        "soft_ceiling": 55.0,
        "momentum_factor": 0.25,
        "mean_reversion_factor": 0.05,
        "breakout_chance": 0.002,
        "breakout_strength": 0.02,
        "crash_chance": 0.003,
        "crash_severity": 0.05,
        "dependency_json": [],
    },
    {
        "ticker": "NOVA",
        "name": "Nova Systems",
        "archetype": "dormant_breakout",
        "current_price": 9.0,
        "target_price": 28.0,
        "shares_outstanding": 140000.0,
        "base_drift": 0.0002,
        "volatility": 0.020,
        "soft_floor": 4.0,
        "soft_ceiling": 40.0,
        "momentum_factor": 0.9,
        "mean_reversion_factor": 0.015,
        "breakout_chance": 0.03,
        "breakout_strength": 0.08,
        "crash_chance": 0.01,
        "crash_severity": 0.09,
        "dependency_json": [],
    },
    {
        "ticker": "HELI",
        "name": "Helix AI",
        "archetype": "boom_bust",
        "current_price": 15.0,
        "target_price": 26.0,
        "shares_outstanding": 130000.0,
        "base_drift": 0.001,
        "volatility": 0.030,
        "soft_floor": 6.0,
        "soft_ceiling": 48.0,
        "momentum_factor": 1.2,
        "mean_reversion_factor": 0.01,
        "breakout_chance": 0.02,
        "breakout_strength": 0.06,
        "crash_chance": 0.03,
        "crash_severity": 0.14,
        "dependency_json": [],
    },
    {
        "ticker": "SYNX",
        "name": "Synex Fabric",
        "archetype": "linked_positive",
        "current_price": 12.0,
        "target_price": 24.0,
        "shares_outstanding": 110000.0,
        "base_drift": 0.001,
        "volatility": 0.018,
        "soft_floor": 5.0,
        "soft_ceiling": 34.0,
        "momentum_factor": 0.7,
        "mean_reversion_factor": 0.02,
        "breakout_chance": 0.01,
        "breakout_strength": 0.04,
        "crash_chance": 0.01,
        "crash_severity": 0.08,
        "dependency_json": [{"ticker": "AURX", "strength": 0.45}],
    },
    {
        "ticker": "RIVA",
        "name": "Rivalis Compute",
        "archetype": "inverse_competitor",
        "current_price": 21.0,
        "target_price": 18.0,
        "shares_outstanding": 95000.0,
        "base_drift": 0.0005,
        "volatility": 0.017,
        "soft_floor": 10.0,
        "soft_ceiling": 34.0,
        "momentum_factor": 0.5,
        "mean_reversion_factor": 0.03,
        "breakout_chance": 0.008,
        "breakout_strength": 0.03,
        "crash_chance": 0.01,
        "crash_severity": 0.08,
        "dependency_json": [{"ticker": "AURX", "strength": -0.35}],
    },
    {
        "ticker": "QLUX",
        "name": "Qlux Recovery",
        "archetype": "distressed_recovery",
        "current_price": 7.5,
        "target_price": 19.0,
        "shares_outstanding": 160000.0,
        "base_drift": -0.0004,
        "volatility": 0.026,
        "soft_floor": 2.5,
        "soft_ceiling": 28.0,
        "momentum_factor": 0.8,
        "mean_reversion_factor": 0.015,
        "breakout_chance": 0.025,
        "breakout_strength": 0.07,
        "crash_chance": 0.015,
        "crash_severity": 0.11,
        "dependency_json": [],
    },
    {
        "ticker": "BRDG",
        "name": "Bridge Reserve",
        "archetype": "safe_haven",
        "current_price": 28.0,
        "target_price": 35.0,
        "shares_outstanding": 125000.0,
        "base_drift": 0.0012,
        "volatility": 0.007,
        "soft_floor": 20.0,
        "soft_ceiling": 45.0,
        "momentum_factor": 0.22,
        "mean_reversion_factor": 0.06,
        "breakout_chance": 0.002,
        "breakout_strength": 0.02,
        "crash_chance": 0.003,
        "crash_severity": 0.04,
        "dependency_json": [],
    },
    {
        "ticker": "VRTX",
        "name": "Vertex Parallel",
        "archetype": "ceiling_runner",
        "current_price": 14.0,
        "target_price": 31.0,
        "shares_outstanding": 105000.0,
        "base_drift": 0.0018,
        "volatility": 0.019,
        "soft_floor": 7.0,
        "soft_ceiling": 36.0,
        "momentum_factor": 0.75,
        "mean_reversion_factor": 0.02,
        "breakout_chance": 0.01,
        "breakout_strength": 0.05,
        "crash_chance": 0.01,
        "crash_severity": 0.08,
        "dependency_json": [{"ticker": "NOVA", "strength": 0.25}],
    },
    {
        "ticker": "MIRA",
        "name": "Mirage Dynamics",
        "archetype": "chain_reactor",
        "current_price": 11.0,
        "target_price": 26.0,
        "shares_outstanding": 150000.0,
        "base_drift": 0.0008,
        "volatility": 0.028,
        "soft_floor": 4.0,
        "soft_ceiling": 38.0,
        "momentum_factor": 1.05,
        "mean_reversion_factor": 0.012,
        "breakout_chance": 0.02,
        "breakout_strength": 0.06,
        "crash_chance": 0.02,
        "crash_severity": 0.12,
        "dependency_json": [{"ticker": "HELI", "strength": 0.30}, {"ticker": "BRDG", "strength": -0.20}],
    },
]


def seed_if_empty() -> None:
    with db_cursor() as (conn, cur):
        cur.execute("SELECT COUNT(*) AS c FROM entities")
        count = cur.fetchone()["c"]
        if count > 0:
            return

        entity_specs = []

        for i in range(110):
            entity_specs.append(
                {
                    "name": f"Individual {i+1}",
                    "entity_type": "individual",
                    "strategy": random.choice(INDIVIDUAL_STRATEGIES),
                    "size_band": "small",
                    "cc_balance": random.uniform(60, 240),
                    "cau_holdings": random.uniform(0.3, 2.2),
                    "reserve_target_cc": random.uniform(40, 120),
                    "efficiency": random.uniform(0.9, 1.1),
                }
            )

        for i in range(30):
            entity_specs.append(
                {
                    "name": f"Small Corp {i+1}",
                    "entity_type": "small_corp",
                    "strategy": random.choice(SMALL_CORP_STRATEGIES),
                    "size_band": "medium",
                    "cc_balance": random.uniform(800, 2200),
                    "cau_holdings": random.uniform(8, 22),
                    "reserve_target_cc": random.uniform(300, 900),
                    "efficiency": random.uniform(0.95, 1.15),
                }
            )

        for i in range(10):
            entity_specs.append(
                {
                    "name": f"Large Business {i+1}",
                    "entity_type": "large_business",
                    "strategy": random.choice(LARGE_BIZ_STRATEGIES),
                    "size_band": "large",
                    "cc_balance": random.uniform(8000, 18000),
                    "cau_holdings": random.uniform(70, 160),
                    "reserve_target_cc": random.uniform(3000, 9000),
                    "efficiency": random.uniform(0.98, 1.2),
                }
            )

        random.shuffle(entity_specs)

        for spec in entity_specs[: settings.entity_count]:
            cur.execute(
                """
                INSERT INTO entities (name, entity_type, strategy, size_band)
                VALUES (?, ?, ?, ?)
                """,
                (spec["name"], spec["entity_type"], spec["strategy"], spec["size_band"]),
            )
            entity_id = cur.lastrowid
            net_worth = spec["cc_balance"] + spec["cau_holdings"] * settings.base_scu_price * 10
            cur.execute(
                """
                INSERT INTO entity_state (
                    entity_id, cc_balance, cau_holdings, scu_inventory, scu_reserved,
                    reserve_target_cc, stress, unmet_scu_demand, efficiency,
                    last_action_summary, net_worth_estimate
                )
                VALUES (?, ?, ?, 0, 0, ?, 0.05, 0, ?, 'seeded', ?)
                """,
                (
                    entity_id,
                    spec["cc_balance"],
                    spec["cau_holdings"],
                    spec["reserve_target_cc"],
                    spec["efficiency"],
                    net_worth,
                ),
            )

        # Seed stocks
        for stock in STOCK_SPECS:
            cur.execute(
                """
                INSERT INTO listed_stocks (
                    ticker, name, archetype, current_price, previous_price, target_price,
                    shares_outstanding, base_drift, volatility, soft_floor, soft_ceiling,
                    momentum_factor, mean_reversion_factor, breakout_chance, breakout_strength,
                    crash_chance, crash_severity, dependency_json, current_regime,
                    regime_ticks_remaining, sentiment, is_active
                )
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'normal', 0, 0, 1)
                """,
                (
                    stock["ticker"],
                    stock["name"],
                    stock["archetype"],
                    stock["current_price"],
                    stock["current_price"],
                    stock["target_price"],
                    stock["shares_outstanding"],
                    stock["base_drift"],
                    stock["volatility"],
                    stock["soft_floor"],
                    stock["soft_ceiling"],
                    stock["momentum_factor"],
                    stock["mean_reversion_factor"],
                    stock["breakout_chance"],
                    stock["breakout_strength"],
                    stock["crash_chance"],
                    stock["crash_severity"],
                    json.dumps(stock["dependency_json"]),
                ),
            )
            stock_id = cur.lastrowid
            cur.execute(
                """
                INSERT INTO stock_price_history (
                    tick, stock_id, ticker, price, shares_traded, volume_cc, regime, sentiment
                )
                VALUES (0, ?, ?, ?, 0, 0, 'normal', 0)
                """,
                (stock_id, stock["ticker"], stock["current_price"]),
            )

        # Seed starter holdings
        cur.execute("SELECT id, ticker, current_price FROM listed_stocks")
        stocks = [dict(r) for r in cur.fetchall()]

        cur.execute(
            """
            SELECT e.id, e.entity_type, s.cc_balance
            FROM entities e
            JOIN entity_state s ON s.entity_id = e.id
            """
        )
        entities = [dict(r) for r in cur.fetchall()]

        for entity in entities:
            entity_id = entity["id"]
            entity_type = entity["entity_type"]
            cc_balance = entity["cc_balance"]

            participates = (
                entity_type == "large_business"
                or (entity_type == "small_corp" and random.random() < 0.70)
                or (entity_type == "individual" and random.random() < 0.30)
            )
            if not participates:
                continue

            if entity_type == "large_business":
                allocation_ratio = random.uniform(0.18, 0.32)
                num_names = random.randint(3, 5)
            elif entity_type == "small_corp":
                allocation_ratio = random.uniform(0.10, 0.22)
                num_names = random.randint(2, 4)
            else:
                allocation_ratio = random.uniform(0.05, 0.14)
                num_names = random.randint(1, 3)

            invest_cc = cc_balance * allocation_ratio
            picks = random.sample(stocks, min(num_names, len(stocks)))
            remaining = invest_cc

            for i, stock in enumerate(picks):
                if remaining <= 2:
                    break
                if i == len(picks) - 1:
                    amount = remaining
                else:
                    amount = remaining * random.uniform(0.25, 0.55)

                shares = amount / max(stock["current_price"], 0.01)
                if shares <= 0.05:
                    continue

                cur.execute(
                    """
                    INSERT INTO entity_stock_holdings (entity_id, stock_id, shares_owned, avg_cost_basis)
                    VALUES (?, ?, ?, ?)
                    """,
                    (entity_id, stock["id"], round(shares, 4), stock["current_price"]),
                )

                cur.execute(
                    "UPDATE entity_state SET cc_balance = cc_balance - ? WHERE entity_id = ?",
                    (round(amount, 4), entity_id),
                )

                remaining -= amount

        cur.execute(
            """
            INSERT INTO system_log (tick, level, message)
            VALUES (0, 'INFO', 'Seeded initial world state and stock market')
            """
        )