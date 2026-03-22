import json
import random
from collections import defaultdict

from app.db import db_cursor


def clamp(value: float, low: float, high: float) -> float:
    return max(low, min(high, value))

def bounded_price_change(value: float) -> float:
    return clamp(value, -0.18, 0.18)

def get_recent_stock_history(limit_ticks: int = 6):
    with db_cursor() as (conn, cur):
        cur.execute(
            """
            SELECT stock_id, ticker, tick, price
            FROM stock_price_history
            ORDER BY tick DESC
            LIMIT ?
            """,
            (limit_ticks * 20,),
        )
        rows = cur.fetchall()

    by_stock = defaultdict(list)
    for row in rows:
        by_stock[row["ticker"]].append(dict(row))

    for ticker in by_stock:
        by_stock[ticker] = list(reversed(by_stock[ticker]))

    return by_stock


def compute_recent_return(history_rows: list[dict]) -> float:
    if len(history_rows) < 2:
        return 0.0
    start = history_rows[0]["price"]
    end = history_rows[-1]["price"]
    if start <= 0:
        return 0.0
    return (end - start) / start


def choose_stock_style(entity_type: str, strategy: str) -> str:
    if strategy in {"trend", "aggressive", "expansion", "opportunist"}:
        return "momentum"
    if strategy in {"cautious", "reserve-heavy", "defensive"}:
        return "defensive"
    if strategy in {"accumulator", "balanced", "stabilizer"}:
        return "value"
    return "mixed"


def archetype_drift(stock: dict, recent_return: float) -> float:
    price = stock["current_price"]
    target = stock["target_price"]
    floor = stock["soft_floor"]
    ceiling = stock["soft_ceiling"]
    archetype = stock["archetype"]
    regime = stock["current_regime"]

    drift = stock["base_drift"]

    # stronger pull back toward target
    mean_reversion = ((target - price) / max(price, 0.01)) * stock["mean_reversion_factor"] * 1.8

    if archetype == "early_growth":
        if price < ceiling * 0.65:
            drift += 0.004
        elif price < ceiling:
            drift += 0.0015
        else:
            drift -= 0.010

    elif archetype == "stable_grind":
        drift += 0.0012
        mean_reversion *= 1.4

    elif archetype == "dormant_breakout":
        drift += 0.0002
        if regime == "breakout":
            drift += stock["breakout_strength"] * 0.35
        elif price > target * 1.35:
            drift -= 0.015

    elif archetype == "boom_bust":
        drift += recent_return * stock["momentum_factor"] * 0.22
        if price > target * 1.25:
            drift -= 0.020

    elif archetype == "linked_positive":
        drift += 0.0008

    elif archetype == "inverse_competitor":
        drift += 0.0005

    elif archetype == "distressed_recovery":
        drift -= 0.001
        if regime == "recovery":
            drift += stock["breakout_strength"] * 0.28

    elif archetype == "safe_haven":
        drift += 0.0008
        mean_reversion *= 1.6

    elif archetype == "ceiling_runner":
        if price < ceiling * 0.75:
            drift += 0.0025
        else:
            drift -= 0.010

    elif archetype == "chain_reactor":
        drift += recent_return * 0.12

    if price < floor:
        drift += 0.01

    if price > ceiling:
        drift -= 0.025

    if price > target * 1.5:
        drift -= 0.035

    return drift + mean_reversion


def dependency_drift(stock: dict, returns_by_ticker: dict[str, float]) -> float:
    dependency_json = stock["dependency_json"]
    if not dependency_json:
        return 0.0

    total = 0.0
    deps = json.loads(dependency_json)
    for dep in deps:
        ticker = dep["ticker"]
        strength = dep["strength"]
        total += returns_by_ticker.get(ticker, 0.0) * strength
    return total


def maybe_advance_regime(stock: dict):
    regime = stock["current_regime"]
    ticks_left = stock["regime_ticks_remaining"]
    price = stock["current_price"]
    target = stock["target_price"]

    if ticks_left > 0:
        return regime, ticks_left - 1

    archetype = stock["archetype"]

    if archetype == "dormant_breakout" and random.random() < stock["breakout_chance"]:
        return "breakout", random.randint(5, 10)

    if archetype == "distressed_recovery" and price < target * 0.7 and random.random() < stock["breakout_chance"]:
        return "recovery", random.randint(5, 9)

    if archetype == "boom_bust" and price > target * 1.6 and random.random() < stock["crash_chance"]:
        return "panic", random.randint(3, 6)

    if archetype == "chain_reactor" and random.random() < stock["breakout_chance"] * 0.7:
        return "breakout", random.randint(3, 6)

    return "normal", 0


def regime_drift(stock: dict) -> float:
    regime = stock["current_regime"]
    if regime == "breakout":
        return stock["breakout_strength"] * 0.35
    if regime == "recovery":
        return stock["breakout_strength"] * 0.22
    if regime == "panic":
        return -stock["crash_severity"] * 0.6
    return 0.0


def build_stock_orders(stocks: list[dict], stock_history: dict[str, list[dict]]):
    with db_cursor() as (conn, cur):
        cur.execute(
            """
            SELECT
                e.id AS entity_id,
                e.entity_type,
                e.strategy,
                s.cc_balance,
                s.reserve_target_cc,
                s.stress
            FROM entities e
            JOIN entity_state s ON s.entity_id = e.id
            WHERE e.is_active = 1
            """
        )
        entities = [dict(r) for r in cur.fetchall()]

        cur.execute(
            """
            SELECT h.entity_id, h.stock_id, h.shares_owned, ls.ticker, ls.current_price
            FROM entity_stock_holdings h
            JOIN listed_stocks ls ON ls.id = h.stock_id
            """
        )
        holding_rows = [dict(r) for r in cur.fetchall()]

    holdings_by_entity = defaultdict(list)
    for row in holding_rows:
        holdings_by_entity[row["entity_id"]].append(row)

    returns_by_ticker = {
        stock["ticker"]: compute_recent_return(stock_history.get(stock["ticker"], []))
        for stock in stocks
    }

    buy_orders = []
    sell_orders = []

    for entity in entities:
        entity_id = entity["entity_id"]
        entity_type = entity["entity_type"]
        style = choose_stock_style(entity_type, entity["strategy"])
        cc = entity["cc_balance"]
        reserve_target = entity["reserve_target_cc"]
        stress = entity["stress"]

        participates = (
            entity_type == "large_business"
            or (entity_type == "small_corp" and entity_id % 10 < 7)
            or (entity_type == "individual" and entity_id % 10 < 3)
        )
        if not participates:
            continue

        holdings = holdings_by_entity.get(entity_id, [])

        for holding in holdings:
            recent_return = returns_by_ticker.get(holding["ticker"], 0.0)
            sell_fraction = 0.0

            if stress > 0.78:
                sell_fraction = random.uniform(0.20, 0.50)
            elif style == "momentum" and recent_return < -0.05:
                sell_fraction = random.uniform(0.15, 0.35)
            elif style == "defensive" and stress > 0.45:
                sell_fraction = random.uniform(0.08, 0.20)
            elif style == "value" and recent_return > 0.12:
                sell_fraction = random.uniform(0.06, 0.18)

            if sell_fraction > 0:
                qty = holding["shares_owned"] * sell_fraction
                if qty > 0.05:
                    sell_orders.append(
                        {
                            "entity_id": entity_id,
                            "stock_id": holding["stock_id"],
                            "ticker": holding["ticker"],
                            "quantity": round(qty, 4),
                        }
                    )

        excess_cc = cc - reserve_target
        buy_budget = 0.0

        if style == "momentum" and cc > reserve_target * 0.95:
            buy_budget = cc * random.uniform(0.04, 0.10)
        elif style == "value" and excess_cc > 0:
            buy_budget = excess_cc * random.uniform(0.15, 0.35)
        elif style == "defensive" and cc > reserve_target * 1.15:
            buy_budget = excess_cc * random.uniform(0.10, 0.20)
        elif style == "mixed" and cc > reserve_target * 1.05:
            buy_budget = excess_cc * random.uniform(0.08, 0.18)

        if stress > 0.65:
            buy_budget *= 0.25

        if buy_budget <= 1.0:
            continue

        scored = []
        for stock in stocks:
            recent_return = returns_by_ticker.get(stock["ticker"], 0.0)
            value_gap = (stock["target_price"] - stock["current_price"]) / max(stock["current_price"], 0.01)
            score = 0.0

            if style == "momentum":
                score = recent_return * 1.6 + (0.15 if stock["current_regime"] == "breakout" else 0.0)
            elif style == "value":
                score = value_gap * 1.3 - max(0.0, recent_return * 0.4)
            elif style == "defensive":
                score = (
                    (0.2 if stock["archetype"] in {"stable_grind", "safe_haven"} else 0.0)
                    + value_gap * 0.4
                    - stock["volatility"] * 0.4
                )
            else:
                score = value_gap * 0.6 + recent_return * 0.5

            scored.append((score, stock))

        scored.sort(key=lambda x: x[0], reverse=True)
        if not scored or scored[0][0] <= -0.05:
            continue

        chosen_stock = scored[0][1]
        qty = buy_budget / max(chosen_stock["current_price"], 0.01)
        if qty > 0.05:
            buy_orders.append(
                {
                    "entity_id": entity_id,
                    "stock_id": chosen_stock["id"],
                    "ticker": chosen_stock["ticker"],
                    "quantity": round(qty, 4),
                }
            )

    return buy_orders, sell_orders


def advance_stock_market(tick: int):
    with db_cursor() as (conn, cur):
        cur.execute("SELECT * FROM listed_stocks WHERE is_active = 1 ORDER BY id ASC")
        stocks = [dict(r) for r in cur.fetchall()]

    if not stocks:
        return

    stock_history = get_recent_stock_history(limit_ticks=6)
    returns_by_ticker = {
        stock["ticker"]: compute_recent_return(stock_history.get(stock["ticker"], []))
        for stock in stocks
    }

    updated_regimes = {}
    for stock in stocks:
        new_regime, ticks_left = maybe_advance_regime(stock)
        updated_regimes[stock["ticker"]] = (new_regime, ticks_left)

    for stock in stocks:
        stock["current_regime"], stock["regime_ticks_remaining"] = updated_regimes[stock["ticker"]]

    buy_orders, sell_orders = build_stock_orders(stocks, stock_history)

    buy_by_stock = defaultdict(list)
    sell_by_stock = defaultdict(list)

    for o in buy_orders:
        buy_by_stock[o["stock_id"]].append(o)
    for o in sell_orders:
        sell_by_stock[o["stock_id"]].append(o)

    with db_cursor() as (conn, cur):
        for stock in stocks:
            stock_id = stock["id"]
            old_price = stock["current_price"]
            recent_return = returns_by_ticker.get(stock["ticker"], 0.0)

            stock_buy_orders = buy_by_stock.get(stock_id, [])
            stock_sell_orders = sell_by_stock.get(stock_id, [])

            total_buy = sum(o["quantity"] for o in stock_buy_orders)
            total_sell = sum(o["quantity"] for o in stock_sell_orders)

            imbalance = (total_buy - total_sell) / max(total_buy, total_sell, 1.0)
            drift = archetype_drift(stock, recent_return)
            dep = dependency_drift(stock, returns_by_ticker)
            reg = regime_drift(stock)
            noise = random.uniform(-stock["volatility"], stock["volatility"]) * 0.18
            order_pressure = imbalance * (0.02 + stock["momentum_factor"] * 0.015)
            dep = dep * 0.35

            raw_price_change = drift + dep + reg + noise + order_pressure
            price_change = bounded_price_change(raw_price_change)

            hard_cap = max(stock["soft_ceiling"] * 1.35, stock["target_price"] * 1.6)
            new_price = max(0.25, min(hard_cap, old_price * (1.0 + price_change)))

            matched_qty = min(total_buy, total_sell)
            fill_ratio_buy = matched_qty / total_buy if total_buy > 0 else 0.0
            fill_ratio_sell = matched_qty / total_sell if total_sell > 0 else 0.0

            for order in stock_buy_orders:
                filled = order["quantity"] * fill_ratio_buy
                cost = filled * old_price

                cur.execute("SELECT cc_balance FROM entity_state WHERE entity_id = ?", (order["entity_id"],))
                row = cur.fetchone()
                if row is None:
                    continue

                affordable = min(filled, row["cc_balance"] / max(old_price, 0.01))
                actual_cost = affordable * old_price
                if affordable <= 0:
                    continue

                cur.execute(
                    "UPDATE entity_state SET cc_balance = cc_balance - ? WHERE entity_id = ?",
                    (round(actual_cost, 4), order["entity_id"]),
                )

                cur.execute(
                    """
                    INSERT INTO entity_stock_holdings (entity_id, stock_id, shares_owned, avg_cost_basis)
                    VALUES (?, ?, ?, ?)
                    ON CONFLICT(entity_id, stock_id) DO UPDATE SET
                        avg_cost_basis = (
                            (entity_stock_holdings.shares_owned * entity_stock_holdings.avg_cost_basis) +
                            (excluded.shares_owned * excluded.avg_cost_basis)
                        ) / (entity_stock_holdings.shares_owned + excluded.shares_owned),
                        shares_owned = entity_stock_holdings.shares_owned + excluded.shares_owned
                    """,
                    (order["entity_id"], stock_id, round(affordable, 4), round(old_price, 4)),
                )

                cur.execute(
                    """
                    INSERT INTO stock_trades (
                        tick, entity_id, stock_id, ticker, side,
                        requested_quantity, filled_quantity, price, notional_cc
                    )
                    VALUES (?, ?, ?, ?, 'buy', ?, ?, ?, ?)
                    """,
                    (
                        tick,
                        order["entity_id"],
                        stock_id,
                        stock["ticker"],
                        order["quantity"],
                        round(affordable, 4),
                        round(old_price, 4),
                        round(actual_cost, 4),
                    ),
                )

            for order in stock_sell_orders:
                cur.execute(
                    "SELECT shares_owned FROM entity_stock_holdings WHERE entity_id = ? AND stock_id = ?",
                    (order["entity_id"], stock_id),
                )
                row = cur.fetchone()
                if row is None:
                    continue

                filled = order["quantity"] * fill_ratio_sell
                actual_filled = min(filled, row["shares_owned"])
                proceeds = actual_filled * old_price

                if actual_filled <= 0:
                    continue

                cur.execute(
                    "UPDATE entity_state SET cc_balance = cc_balance + ? WHERE entity_id = ?",
                    (round(proceeds, 4), order["entity_id"]),
                )

                cur.execute(
                    """
                    UPDATE entity_stock_holdings
                    SET shares_owned = shares_owned - ?
                    WHERE entity_id = ? AND stock_id = ?
                    """,
                    (round(actual_filled, 4), order["entity_id"], stock_id),
                )

                cur.execute(
                    """
                    DELETE FROM entity_stock_holdings
                    WHERE entity_id = ? AND stock_id = ? AND shares_owned <= 0.0001
                    """,
                    (order["entity_id"], stock_id),
                )

                cur.execute(
                    """
                    INSERT INTO stock_trades (
                        tick, entity_id, stock_id, ticker, side,
                        requested_quantity, filled_quantity, price, notional_cc
                    )
                    VALUES (?, ?, ?, ?, 'sell', ?, ?, ?, ?)
                    """,
                    (
                        tick,
                        order["entity_id"],
                        stock_id,
                        stock["ticker"],
                        order["quantity"],
                        round(actual_filled, 4),
                        round(old_price, 4),
                        round(proceeds, 4),
                    ),
                )

            cur.execute(
                """
                UPDATE listed_stocks
                SET previous_price = current_price,
                    current_price = ?,
                    current_regime = ?,
                    regime_ticks_remaining = ?,
                    sentiment = ?
                WHERE id = ?
                """,
                (
                    round(new_price, 4),
                    stock["current_regime"],
                    stock["regime_ticks_remaining"],
                    round(imbalance, 4),
                    stock_id,
                ),
            )

            cur.execute(
                """
                INSERT INTO stock_price_history (
                    tick, stock_id, ticker, price, shares_traded, volume_cc, regime, sentiment
                )
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    tick,
                    stock_id,
                    stock["ticker"],
                    round(new_price, 4),
                    round(matched_qty, 4),
                    round(matched_qty * old_price, 4),
                    stock["current_regime"],
                    round(imbalance, 4),
                ),
            )