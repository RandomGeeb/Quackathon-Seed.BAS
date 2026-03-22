import random
from app.config import settings
from app.db import db_cursor


INDIVIDUAL_STRATEGIES = ["steady", "cautious", "trend", "scarcity", "opportunist"]
SMALL_CORP_STRATEGIES = ["balanced", "reserve-heavy", "expansion", "reactive"]
LARGE_BIZ_STRATEGIES = ["stabilizer", "aggressive", "accumulator", "defensive"]


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

        cur.execute(
            """
            INSERT INTO system_log (tick, level, message)
            VALUES (0, 'INFO', 'Seeded initial world state')
            """
        )