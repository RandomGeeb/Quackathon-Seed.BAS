import asyncio
import json
import random
from datetime import datetime, timezone

from app.config import settings
from app.db import db_cursor
from app.sim.events import expire_events, maybe_spawn_events, get_event_modifiers
from app.sim.agents import build_agent_orders


class SimulationEngine:
    def __init__(self):
        self._task = None
        self._running = False

    async def start(self):
        if self._task is None:
            self._running = True
            self._task = asyncio.create_task(self._run_loop())

    async def stop(self):
        self._running = False
        if self._task is not None:
            self._task.cancel()
            try:
                await self._task
            except asyncio.CancelledError:
                pass
            self._task = None

    async def _run_loop(self):
        while self._running:
            try:
                self.run_tick()
            except Exception as exc:
                with db_cursor() as (conn, cur):
                    cur.execute(
                        "INSERT INTO system_log (tick, level, message) VALUES (NULL, 'ERROR', ?)",
                        (f"Tick failure: {exc}",),
                    )
            await asyncio.sleep(settings.tick_seconds)

    def run_tick(self):
        with db_cursor() as (conn, cur):
            cur.execute("SELECT * FROM world_state WHERE id = 1")
            world = cur.fetchone()
            next_tick = world["current_tick"] + 1
            cur.execute(
                "UPDATE world_state SET current_tick = ?, last_tick_at = ? WHERE id = 1",
                (next_tick, datetime.now(timezone.utc).isoformat()),
            )

        expire_events(next_tick)
        maybe_spawn_events(next_tick)
        self._process_queued_actions(next_tick)

        modifiers = get_event_modifiers()

        self._produce_scu(next_tick, modifiers)
        market_result = self._run_market(next_tick, modifiers)
        self._auto_distress_liquidations(next_tick)
        self._update_stress_and_wealth(next_tick, modifiers)
        self._record_tick_metrics(next_tick, market_result)

    def _process_queued_actions(self, tick: int):
        with db_cursor() as (conn, cur):
            cur.execute(
                """
                SELECT *
                FROM action_queue
                WHERE status = 'pending' AND execute_on_tick <= ?
                ORDER BY id ASC
                """,
                (tick,),
            )
            actions = [dict(r) for r in cur.fetchall()]

        for action in actions:
            result = {"ok": True, "message": "processed"}
            try:
                payload = json.loads(action["payload_json"])

                if action["action_type"] == "transfer_cc":
                    result = self._execute_transfer_cc(action["actor_entity_id"], action["target_entity_id"], payload["amount"])

                elif action["action_type"] == "manual_buy_scu":
                    result = self._execute_manual_buy_scu(action["actor_entity_id"], payload["quantity"])

                elif action["action_type"] == "manual_sell_scu":
                    result = self._execute_manual_sell_scu(action["actor_entity_id"], payload["quantity"])

                elif action["action_type"] == "withhold_scu":
                    result = self._execute_withhold_scu(action["actor_entity_id"], payload["quantity"])

                elif action["action_type"] == "liquidate_cau":
                    result = self._execute_liquidate_cau(action["actor_entity_id"], payload["cau_to_sell"])

                elif action["action_type"] == "trigger_event":
                    result = self._execute_trigger_event(tick, payload)

                else:
                    result = {"ok": False, "message": f"unknown action type {action['action_type']}"}

            except Exception as exc:
                result = {"ok": False, "message": str(exc)}

            with db_cursor() as (conn, cur):
                cur.execute(
                    """
                    UPDATE action_queue
                    SET status = ?, processed_at = CURRENT_TIMESTAMP
                    WHERE id = ?
                    """,
                    ("processed" if result["ok"] else "failed", action["id"]),
                )
                cur.execute(
                    """
                    INSERT INTO executed_actions (
                        tick, actor_entity_id, target_entity_id, action_type,
                        payload_json, result_json, source
                    )
                    VALUES (?, ?, ?, ?, ?, ?, ?)
                    """,
                    (
                        tick,
                        action["actor_entity_id"],
                        action["target_entity_id"],
                        action["action_type"],
                        action["payload_json"],
                        json.dumps(result),
                        action["source"],
                    ),
                )

    def _execute_transfer_cc(self, actor_entity_id: int, target_entity_id: int, amount: float):
        with db_cursor() as (conn, cur):
            cur.execute("SELECT cc_balance FROM entity_state WHERE entity_id = ?", (actor_entity_id,))
            actor = cur.fetchone()
            if actor is None:
                return {"ok": False, "message": "actor not found"}
            if actor["cc_balance"] < amount:
                return {"ok": False, "message": "insufficient CC"}

            cur.execute("UPDATE entity_state SET cc_balance = cc_balance - ? WHERE entity_id = ?", (amount, actor_entity_id))
            cur.execute("UPDATE entity_state SET cc_balance = cc_balance + ? WHERE entity_id = ?", (amount, target_entity_id))
            cur.execute(
                "INSERT INTO system_log (tick, level, message) VALUES (NULL, 'INFO', ?)",
                (f"Manual transfer: {amount:.2f} CC from {actor_entity_id} to {target_entity_id}",),
            )
        return {"ok": True, "message": "transfer completed"}

    def _execute_manual_buy_scu(self, actor_entity_id: int, quantity: float):
        with db_cursor() as (conn, cur):
            cur.execute("SELECT scu_price FROM market_state WHERE id = 1")
            price = cur.fetchone()["scu_price"]

            cur.execute("SELECT cc_balance FROM entity_state WHERE entity_id = ?", (actor_entity_id,))
            row = cur.fetchone()
            if row is None:
                return {"ok": False, "message": "entity not found"}

            affordable = row["cc_balance"] / max(price, 0.01)
            filled = min(quantity, affordable)
            cost = filled * price

            cur.execute(
                """
                UPDATE entity_state
                SET cc_balance = cc_balance - ?,
                    scu_inventory = scu_inventory + ?,
                    unmet_scu_demand = unmet_scu_demand + ?
                WHERE entity_id = ?
                """,
                (cost, filled, max(0.0, quantity - filled), actor_entity_id),
            )
            cur.execute(
                """
                INSERT INTO market_trades (tick, entity_id, side, requested_quantity, filled_quantity, price, notional_cc)
                SELECT current_tick, ?, 'buy', ?, ?, ?, ?
                FROM world_state WHERE id = 1
                """,
                (actor_entity_id, quantity, filled, price, cost),
            )
        return {"ok": True, "message": "manual buy applied", "filled": round(filled, 4)}

    def _execute_manual_sell_scu(self, actor_entity_id: int, quantity: float):
        with db_cursor() as (conn, cur):
            cur.execute("SELECT scu_price FROM market_state WHERE id = 1")
            price = cur.fetchone()["scu_price"]

            cur.execute("SELECT scu_inventory FROM entity_state WHERE entity_id = ?", (actor_entity_id,))
            row = cur.fetchone()
            if row is None:
                return {"ok": False, "message": "entity not found"}

            filled = min(quantity, row["scu_inventory"])
            proceeds = filled * price

            cur.execute(
                """
                UPDATE entity_state
                SET cc_balance = cc_balance + ?,
                    scu_inventory = scu_inventory - ?
                WHERE entity_id = ?
                """,
                (proceeds, filled, actor_entity_id),
            )
            cur.execute(
                """
                INSERT INTO market_trades (tick, entity_id, side, requested_quantity, filled_quantity, price, notional_cc)
                SELECT current_tick, ?, 'sell', ?, ?, ?, ?
                FROM world_state WHERE id = 1
                """,
                (actor_entity_id, quantity, filled, price, proceeds),
            )
        return {"ok": True, "message": "manual sell applied", "filled": round(filled, 4)}

    def _execute_withhold_scu(self, actor_entity_id: int, quantity: float):
        with db_cursor() as (conn, cur):
            cur.execute("SELECT scu_inventory FROM entity_state WHERE entity_id = ?", (actor_entity_id,))
            row = cur.fetchone()
            if row is None:
                return {"ok": False, "message": "entity not found"}

            inventory = row["scu_inventory"]
            reserved = min(quantity, inventory)

            cur.execute(
                """
                UPDATE entity_state
                SET scu_inventory = scu_inventory - ?,
                    scu_reserved = scu_reserved + ?,
                    last_action_summary = 'manual_withhold'
                WHERE entity_id = ?
                """,
                (reserved, reserved, actor_entity_id),
            )
        return {"ok": True, "message": "withhold applied", "reserved": round(reserved, 4)}

    def _execute_liquidate_cau(self, actor_entity_id: int, cau_to_sell: float):
        with db_cursor() as (conn, cur):
            cur.execute("SELECT cau_holdings FROM entity_state WHERE entity_id = ?", (actor_entity_id,))
            row = cur.fetchone()
            if row is None:
                return {"ok": False, "message": "entity not found"}

            cur.execute("SELECT scu_price FROM market_state WHERE id = 1")
            price = cur.fetchone()["scu_price"]

            sold = min(cau_to_sell, row["cau_holdings"])
            proceeds = sold * price * 8.0

            cur.execute(
                """
                UPDATE entity_state
                SET cau_holdings = cau_holdings - ?,
                    cc_balance = cc_balance + ?,
                    last_action_summary = 'manual_liquidation'
                WHERE entity_id = ?
                """,
                (sold, proceeds, actor_entity_id),
            )
        return {"ok": True, "message": "CAU liquidated", "cau_sold": round(sold, 4)}

    def _execute_trigger_event(self, tick: int, payload: dict):
        end_tick = tick + int(payload["duration_ticks"])
        with db_cursor() as (conn, cur):
            cur.execute(
                """
                INSERT INTO active_events (
                    event_type, name, description, start_tick, end_tick,
                    supply_effect, demand_effect, volatility_effect, stress_effect,
                    price_bias, source
                )
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'admin')
                """,
                (
                    payload["event_type"],
                    payload["name"],
                    payload["description"],
                    tick,
                    end_tick,
                    payload["supply_effect"],
                    payload["demand_effect"],
                    payload["volatility_effect"],
                    payload["stress_effect"],
                    payload["price_bias"],
                ),
            )
        return {"ok": True, "message": "event triggered"}

    def _produce_scu(self, tick: int, modifiers: dict):
        with db_cursor() as (conn, cur):
            cur.execute(
                """
                SELECT entity_id, cau_holdings, efficiency, stress, scu_reserved
                FROM entity_state
                """
            )
            rows = cur.fetchall()

            for row in rows:
                base_output = row["cau_holdings"] * 1.0
                supply_modifier = 1.0 + modifiers["supply"]
                stress_penalty = 1.0 - min(0.35, row["stress"] * 0.25)
                production = max(0.0, base_output * row["efficiency"] * supply_modifier * stress_penalty)

                cur.execute(
                    """
                    UPDATE entity_state
                    SET scu_inventory = scu_inventory + ?
                    WHERE entity_id = ?
                    """,
                    (round(production, 4), row["entity_id"]),
                )

            cur.execute(
                "INSERT INTO system_log (tick, level, message) VALUES (?, 'INFO', ?)",
                (tick, "SCU production completed"),
            )

    def _run_market(self, tick: int, modifiers: dict) -> dict:
        with db_cursor() as (conn, cur):
            cur.execute(
                """
                SELECT
                    e.id AS entity_id,
                    e.entity_type,
                    e.strategy,
                    s.cc_balance,
                    s.cau_holdings,
                    s.scu_inventory,
                    s.reserve_target_cc,
                    s.stress,
                    s.unmet_scu_demand
                FROM entities e
                JOIN entity_state s ON s.entity_id = e.id
                WHERE e.is_active = 1
                """
            )
            entities = [dict(row) for row in cur.fetchall()]

            cur.execute("SELECT * FROM market_state WHERE id = 1")
            market = cur.fetchone()
            current_price = market["scu_price"]

        order_book = build_agent_orders(entities, current_price, modifiers)
        buy_orders = order_book["buy_orders"]
        sell_orders = order_book["sell_orders"]
        summaries = order_book["summaries"]

        total_demand = sum(o["quantity"] for o in buy_orders)
        total_supply = sum(o["quantity"] for o in sell_orders)
        traded_volume = min(total_demand, total_supply)

        shortage_ratio = 0.0
        if total_demand > 0:
            shortage_ratio = max(0.0, (total_demand - traded_volume) / total_demand)

        excess_demand_ratio = 0.0
        if max(total_demand, total_supply) > 0:
            excess_demand_ratio = (total_demand - total_supply) / max(total_demand, total_supply)

        volatility = min(0.5, abs(excess_demand_ratio) * 0.2 + max(0.0, modifiers["volatility"]))
        price_change_factor = 1.0 + (excess_demand_ratio * 0.12) + modifiers["price_bias"] + random.uniform(-0.01, 0.01)
        new_price = max(1.0, current_price * price_change_factor)

        fill_ratio_buy = traded_volume / total_demand if total_demand > 0 else 0.0
        fill_ratio_sell = traded_volume / total_supply if total_supply > 0 else 0.0

        with db_cursor() as (conn, cur):
            for order in buy_orders:
                filled = order["quantity"] * fill_ratio_buy
                cost = filled * current_price

                cur.execute("SELECT cc_balance FROM entity_state WHERE entity_id = ?", (order["entity_id"],))
                state = cur.fetchone()
                affordable_filled = min(filled, state["cc_balance"] / max(current_price, 0.01))
                actual_cost = affordable_filled * current_price

                cur.execute(
                    """
                    UPDATE entity_state
                    SET cc_balance = cc_balance - ?,
                        scu_inventory = scu_inventory + ?,
                        unmet_scu_demand = ?
                    WHERE entity_id = ?
                    """,
                    (
                        round(actual_cost, 4),
                        round(affordable_filled, 4),
                        round(max(0.0, order["quantity"] - affordable_filled), 4),
                        order["entity_id"],
                    ),
                )

                cur.execute(
                    """
                    INSERT INTO market_trades (tick, entity_id, side, requested_quantity, filled_quantity, price, notional_cc)
                    VALUES (?, ?, 'buy', ?, ?, ?, ?)
                    """,
                    (tick, order["entity_id"], order["quantity"], round(affordable_filled, 4), current_price, round(actual_cost, 4)),
                )

            for order in sell_orders:
                filled = order["quantity"] * fill_ratio_sell
                notional = filled * current_price

                cur.execute("SELECT scu_inventory, scu_reserved FROM entity_state WHERE entity_id = ?", (order["entity_id"],))
                state = cur.fetchone()
                available = max(0.0, state["scu_inventory"])
                actual_filled = min(filled, available)
                actual_notional = actual_filled * current_price

                cur.execute(
                    """
                    UPDATE entity_state
                    SET cc_balance = cc_balance + ?,
                        scu_inventory = scu_inventory - ?,
                        unmet_scu_demand = unmet_scu_demand * 0.85
                    WHERE entity_id = ?
                    """,
                    (round(actual_notional, 4), round(actual_filled, 4), order["entity_id"]),
                )

                cur.execute(
                    """
                    INSERT INTO market_trades (tick, entity_id, side, requested_quantity, filled_quantity, price, notional_cc)
                    VALUES (?, ?, 'sell', ?, ?, ?, ?)
                    """,
                    (tick, order["entity_id"], order["quantity"], round(actual_filled, 4), current_price, round(actual_notional, 4)),
                )

            for entity_id, summary in summaries.items():
                cur.execute("UPDATE entity_state SET last_action_summary = ? WHERE entity_id = ?", (summary, entity_id))

            cur.execute(
                """
                UPDATE market_state
                SET scu_price = ?, last_total_supply = ?, last_total_demand = ?,
                    last_traded_volume = ?, last_shortage_ratio = ?, last_volatility = ?
                WHERE id = 1
                """,
                (
                    round(new_price, 4),
                    round(total_supply, 4),
                    round(total_demand, 4),
                    round(traded_volume, 4),
                    round(shortage_ratio, 4),
                    round(volatility, 4),
                ),
            )

        return {
            "price": new_price,
            "total_supply": total_supply,
            "total_demand": total_demand,
            "traded_volume": traded_volume,
            "shortage_ratio": shortage_ratio,
            "volatility": volatility,
        }

    def _auto_distress_liquidations(self, tick: int):
        with db_cursor() as (conn, cur):
            cur.execute("SELECT scu_price FROM market_state WHERE id = 1")
            price = cur.fetchone()["scu_price"]

            cur.execute("SELECT entity_id, stress, cau_holdings FROM entity_state")
            rows = cur.fetchall()

            for row in rows:
                if row["stress"] >= 0.85 and row["cau_holdings"] > 0.1:
                    cau_sold = min(row["cau_holdings"] * 0.08, row["cau_holdings"])
                    proceeds = cau_sold * price * 7.0

                    cur.execute(
                        """
                        UPDATE entity_state
                        SET cau_holdings = cau_holdings - ?,
                            cc_balance = cc_balance + ?,
                            last_action_summary = 'distress_liquidation'
                        WHERE entity_id = ?
                        """,
                        (round(cau_sold, 4), round(proceeds, 4), row["entity_id"]),
                    )
                    cur.execute(
                        "INSERT INTO system_log (tick, level, message) VALUES (?, 'WARN', ?)",
                        (tick, f"Distress liquidation for entity {row['entity_id']}"),
                    )

    def _update_stress_and_wealth(self, tick: int, modifiers: dict):
        with db_cursor() as (conn, cur):
            cur.execute("SELECT scu_price FROM market_state WHERE id = 1")
            price = cur.fetchone()["scu_price"]

            cur.execute("SELECT * FROM entity_state")
            rows = cur.fetchall()

            for row in rows:
                reserve_gap = max(0.0, row["reserve_target_cc"] - row["cc_balance"])
                reserve_pressure = reserve_gap / max(row["reserve_target_cc"], 1.0)
                shortage_pressure = min(1.0, row["unmet_scu_demand"] / 5.0)
                inventory_pressure = 0.12 if row["scu_inventory"] < 0.5 else 0.0

                stress = (
                    0.5 * reserve_pressure
                    + 0.35 * shortage_pressure
                    + inventory_pressure
                    + max(0.0, modifiers["stress"])
                )

                stress = max(0.0, min(1.0, stress))
                net_worth = row["cc_balance"] + (row["cau_holdings"] * price * 10.0) + (row["scu_inventory"] * price) + (row["scu_reserved"] * price)

                cur.execute(
                    """
                    UPDATE entity_state
                    SET stress = ?, net_worth_estimate = ?
                    WHERE entity_id = ?
                    """,
                    (round(stress, 4), round(net_worth, 4), row["entity_id"]),
                )

                cur.execute(
                    """
                    INSERT INTO entity_state_history (
                        tick, entity_id, cc_balance, cau_holdings, scu_inventory, scu_reserved,
                        reserve_target_cc, stress, unmet_scu_demand, net_worth_estimate
                    )
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                    """,
                    (
                        tick,
                        row["entity_id"],
                        row["cc_balance"],
                        row["cau_holdings"],
                        row["scu_inventory"],
                        row["scu_reserved"],
                        row["reserve_target_cc"],
                        round(stress, 4),
                        row["unmet_scu_demand"],
                        round(net_worth, 4),
                    ),
                )

    def _record_tick_metrics(self, tick: int, market_result: dict):
        with db_cursor() as (conn, cur):
            cur.execute("SELECT * FROM entity_state")
            states = cur.fetchall()

            total_cc = sum(row["cc_balance"] for row in states)
            total_cau = sum(row["cau_holdings"] for row in states)
            total_scu_inventory = sum(row["scu_inventory"] for row in states)
            total_scu_reserved = sum(row["scu_reserved"] for row in states)
            avg_stress = sum(row["stress"] for row in states) / max(len(states), 1)

            wealths = sorted((row["net_worth_estimate"] for row in states), reverse=True)
            total_wealth = sum(wealths) if wealths else 1.0
            top_1_wealth_share = wealths[0] / total_wealth if wealths else 0.0
            top_10_wealth_share = sum(wealths[:10]) / total_wealth if wealths else 0.0

            cur.execute("SELECT COUNT(*) AS c FROM active_events")
            active_event_count = cur.fetchone()["c"]

            cur.execute(
                """
                INSERT OR REPLACE INTO tick_metrics (
                    tick, scu_price, total_cc, total_cau, total_scu_inventory, total_scu_reserved,
                    total_supply, total_demand, traded_volume, avg_stress, top_1_wealth_share,
                    top_10_wealth_share, active_event_count
                )
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    tick,
                    round(market_result["price"], 4),
                    round(total_cc, 4),
                    round(total_cau, 4),
                    round(total_scu_inventory, 4),
                    round(total_scu_reserved, 4),
                    round(market_result["total_supply"], 4),
                    round(market_result["total_demand"], 4),
                    round(market_result["traded_volume"], 4),
                    round(avg_stress, 4),
                    round(top_1_wealth_share, 4),
                    round(top_10_wealth_share, 4),
                    active_event_count,
                ),
            )

            cur.execute(
                """
                INSERT INTO system_log (tick, level, message)
                VALUES (?, 'INFO', ?)
                """,
                (
                    tick,
                    f"Tick completed. Price={market_result['price']:.2f}, Demand={market_result['total_demand']:.2f}, Supply={market_result['total_supply']:.2f}",
                ),
            )