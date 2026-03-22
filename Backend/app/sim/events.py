import random
from app.config import settings
from app.db import db_cursor


MICRO_EVENTS = [
    {
        "event_type": "reserve_caution",
        "name": "Reserve Caution",
        "description": "Entities become more defensive and raise short-term liquidity preference.",
        "duration": (3, 6),
        "supply_effect": -0.03,
        "demand_effect": -0.05,
        "volatility_effect": 0.05,
        "stress_effect": 0.04,
        "price_bias": 0.00,
        "chance": 0.18,
    },
    {
        "event_type": "local_outage",
        "name": "Local Cooling Failure",
        "description": "A localized compute interruption reduces available SCU output.",
        "duration": (2, 5),
        "supply_effect": -0.10,
        "demand_effect": 0.01,
        "volatility_effect": 0.06,
        "stress_effect": 0.03,
        "price_bias": 0.04,
        "chance": 0.13,
    },
    {
        "event_type": "speculative_chatter",
        "name": "Speculative Chatter",
        "description": "Momentum-sensitive actors become more aggressive.",
        "duration": (3, 6),
        "supply_effect": -0.01,
        "demand_effect": 0.08,
        "volatility_effect": 0.10,
        "stress_effect": 0.01,
        "price_bias": 0.03,
        "chance": 0.12,
    },
    {
        "event_type": "procurement_spike",
        "name": "Short Procurement Spike",
        "description": "A burst of urgent compute demand hits the market.",
        "duration": (2, 4),
        "supply_effect": 0.00,
        "demand_effect": 0.12,
        "volatility_effect": 0.05,
        "stress_effect": 0.03,
        "price_bias": 0.05,
        "chance": 0.15,
    },
    {
        "event_type": "routing_bottleneck",
        "name": "Routing Bottleneck",
        "description": "Operational frictions reduce effective market flow and raise mismatch risk.",
        "duration": (3, 5),
        "supply_effect": -0.04,
        "demand_effect": 0.02,
        "volatility_effect": 0.07,
        "stress_effect": 0.03,
        "price_bias": 0.02,
        "chance": 0.10,
    },
]

REGIME_EVENTS = [
    {
        "event_type": "liquidity_squeeze",
        "name": "Liquidity Squeeze",
        "description": "Entities hoard CC, reduce participation, and become balance-sheet defensive.",
        "duration": (5, 10),
        "supply_effect": -0.05,
        "demand_effect": -0.10,
        "volatility_effect": 0.16,
        "stress_effect": 0.14,
        "price_bias": -0.04,
        "chance": 0.045,
    },
    {
        "event_type": "sector_compute_boom",
        "name": "Sector Compute Boom",
        "description": "A broad expansion in compute demand lifts pressure across the market.",
        "duration": (5, 9),
        "supply_effect": 0.00,
        "demand_effect": 0.18,
        "volatility_effect": 0.10,
        "stress_effect": 0.05,
        "price_bias": 0.08,
        "chance": 0.04,
    },
    {
        "event_type": "confidence_shock",
        "name": "Confidence Shock",
        "description": "Participation falls as entities become cautious and withdraw supply.",
        "duration": (4, 8),
        "supply_effect": -0.08,
        "demand_effect": -0.03,
        "volatility_effect": 0.14,
        "stress_effect": 0.10,
        "price_bias": 0.01,
        "chance": 0.04,
    },
    {
        "event_type": "public_reserve_release",
        "name": "Public Reserve Release",
        "description": "Emergency reserve supply is released, easing price pressure.",
        "duration": (3, 6),
        "supply_effect": 0.18,
        "demand_effect": 0.00,
        "volatility_effect": -0.05,
        "stress_effect": -0.08,
        "price_bias": -0.08,
        "chance": 0.025,
    },
]

CRISIS_EVENTS = [
    {
        "event_type": "major_outage",
        "name": "Major Compute Outage",
        "description": "A large outage sharply cuts production and intensifies scarcity.",
        "duration": (4, 8),
        "supply_effect": -0.28,
        "demand_effect": 0.04,
        "volatility_effect": 0.22,
        "stress_effect": 0.14,
        "price_bias": 0.12,
        "chance": 0.018,
    },
    {
        "event_type": "flash_liquidity_vacuum",
        "name": "Flash Liquidity Vacuum",
        "description": "Market depth collapses temporarily and prices become highly unstable.",
        "duration": (2, 4),
        "supply_effect": -0.06,
        "demand_effect": -0.01,
        "volatility_effect": 0.30,
        "stress_effect": 0.10,
        "price_bias": 0.00,
        "chance": 0.015,
    },
    {
        "event_type": "panic_hoarding",
        "name": "Panic Hoarding Episode",
        "description": "Entities withdraw supply and hoard liquidity and compute reserves.",
        "duration": (4, 7),
        "supply_effect": -0.16,
        "demand_effect": -0.06,
        "volatility_effect": 0.20,
        "stress_effect": 0.16,
        "price_bias": 0.06,
        "chance": 0.018,
    },
]


def maybe_spawn_events(current_tick: int) -> None:
    all_specs = MICRO_EVENTS + REGIME_EVENTS + CRISIS_EVENTS
    with db_cursor() as (conn, cur):
        cur.execute("SELECT COUNT(*) AS c FROM active_events")
        active_count = cur.fetchone()["c"]

        for spec in all_specs:
            chance = spec["chance"]

            if active_count >= 4:
                chance *= 0.7
            elif active_count == 0:
                chance *= 1.15

            if random.random() < chance:
                duration = random.randint(spec["duration"][0], spec["duration"][1])
                end_tick = current_tick + duration

                cur.execute(
                    """
                    INSERT INTO active_events (
                        event_type, name, description, start_tick, end_tick,
                        supply_effect, demand_effect, volatility_effect, stress_effect,
                        price_bias, source
                    )
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'system')
                    """,
                    (
                        spec["event_type"],
                        spec["name"],
                        spec["description"],
                        current_tick,
                        end_tick,
                        spec["supply_effect"],
                        spec["demand_effect"],
                        spec["volatility_effect"],
                        spec["stress_effect"],
                        spec["price_bias"],
                    ),
                )

                cur.execute(
                    """
                    INSERT INTO system_log (tick, level, message)
                    VALUES (?, 'INFO', ?)
                    """,
                    (current_tick, f"Event started: {spec['name']}"),
                )


def expire_events(current_tick: int) -> None:
    with db_cursor() as (conn, cur):
        cur.execute("SELECT * FROM active_events WHERE end_tick <= ?", (current_tick,))
        expired = cur.fetchall()

        for row in expired:
            cur.execute(
                """
                INSERT INTO event_history (
                    event_type, name, description, start_tick, end_tick, source
                )
                VALUES (?, ?, ?, ?, ?, ?)
                """,
                (
                    row["event_type"],
                    row["name"],
                    row["description"],
                    row["start_tick"],
                    row["end_tick"],
                    row["source"],
                ),
            )

            cur.execute(
                "INSERT INTO system_log (tick, level, message) VALUES (?, 'INFO', ?)",
                (current_tick, f"Event ended: {row['name']}"),
            )

        cur.execute("DELETE FROM active_events WHERE end_tick <= ?", (current_tick,))


def get_event_modifiers() -> dict:
    with db_cursor() as (conn, cur):
        cur.execute("SELECT * FROM active_events")
        rows = cur.fetchall()

    supply = sum(row["supply_effect"] for row in rows)
    demand = sum(row["demand_effect"] for row in rows)
    volatility = sum(row["volatility_effect"] for row in rows)
    stress = sum(row["stress_effect"] for row in rows)
    price_bias = sum(row["price_bias"] for row in rows)

    cap = settings.max_event_modifier
    return {
        "supply": max(-cap, min(cap, supply)),
        "demand": max(-cap, min(cap, demand)),
        "volatility": max(-cap, min(cap, volatility)),
        "stress": max(-cap, min(cap, stress)),
        "price_bias": max(-cap, min(cap, price_bias)),
    }