import random
from typing import Dict, List
from app.config import settings
from app.db import db_cursor


SMALL_EVENTS = [
    {
        "event_type": "demand_surge",
        "name": "Demand Pulse",
        "description": "Temporary rise in compute demand across the market.",
        "duration": (3, 6),
        "supply_effect": 0.0,
        "demand_effect": 0.10,
        "volatility_effect": 0.05,
        "stress_effect": 0.03,
        "price_bias": 0.04,
        "chance": 0.16,
    },
    {
        "event_type": "local_outage",
        "name": "Local Data Centre Outage",
        "description": "A localized outage reduces available supply.",
        "duration": (2, 5),
        "supply_effect": -0.08,
        "demand_effect": 0.0,
        "volatility_effect": 0.04,
        "stress_effect": 0.02,
        "price_bias": 0.03,
        "chance": 0.12,
    },
    {
        "event_type": "mood_shift",
        "name": "Speculative Mood Shift",
        "description": "Mild speculative behavior increases price sensitivity.",
        "duration": (3, 5),
        "supply_effect": 0.0,
        "demand_effect": 0.04,
        "volatility_effect": 0.08,
        "stress_effect": 0.01,
        "price_bias": 0.02,
        "chance": 0.10,
    },
]

LARGE_EVENTS = [
    {
        "event_type": "liquidity_squeeze",
        "name": "Liquidity Squeeze",
        "description": "Cash preservation behavior spreads and demand weakens sharply.",
        "duration": (5, 9),
        "supply_effect": -0.03,
        "demand_effect": -0.10,
        "volatility_effect": 0.12,
        "stress_effect": 0.12,
        "price_bias": -0.03,
        "chance": 0.035,
    },
    {
        "event_type": "major_outage",
        "name": "Major Compute Outage",
        "description": "A broad outage knocks out a significant amount of supply.",
        "duration": (4, 8),
        "supply_effect": -0.22,
        "demand_effect": 0.03,
        "volatility_effect": 0.15,
        "stress_effect": 0.10,
        "price_bias": 0.10,
        "chance": 0.02,
    },
    {
        "event_type": "public_reserve_release",
        "name": "Public Reserve Release",
        "description": "Emergency reserve supply is released into the market.",
        "duration": (3, 6),
        "supply_effect": 0.14,
        "demand_effect": 0.0,
        "volatility_effect": -0.04,
        "stress_effect": -0.08,
        "price_bias": -0.07,
        "chance": 0.02,
    },
]


def maybe_spawn_events(current_tick: int) -> None:
    all_specs = SMALL_EVENTS + LARGE_EVENTS
    with db_cursor() as (conn, cur):
        for spec in all_specs:
            if random.random() < spec["chance"]:
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


def get_event_modifiers() -> Dict[str, float]:
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