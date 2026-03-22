import random
from typing import Dict, List


def clamp(value: float, low: float, high: float) -> float:
    return max(low, min(high, value))


def safe_div(a: float, b: float) -> float:
    return a / b if b else 0.0


def determine_mode(entity: dict, market_context: dict, event_modifiers: Dict[str, float]) -> str:
    cc = entity["cc_balance"]
    reserve_target = entity["reserve_target_cc"]
    stress = entity["stress"]
    unmet = entity["unmet_scu_demand"]

    reserve_gap_ratio = max(0.0, reserve_target - cc) / max(reserve_target, 1.0)
    price_trend = market_context["price_trend"]
    recent_volatility = market_context["recent_volatility"]
    recent_shortage = market_context["recent_shortage"]
    event_types = market_context["event_types"]

    if stress > 0.82 or reserve_gap_ratio > 0.40 or unmet > 4.0:
        return "panic"

    if stress > 0.55 or reserve_gap_ratio > 0.18 or recent_volatility > 0.09 or recent_shortage > 0.18:
        return "defensive"

    if (
        cc > reserve_target * 1.45
        and stress < 0.22
        and (price_trend < -0.03 or recent_shortage > 0.22)
    ):
        return "opportunistic"

    if (
        entity["entity_type"] in {"small_corp", "large_business"}
        and cc > reserve_target * 1.8
        and stress < 0.18
        and recent_volatility < 0.06
        and "liquidity_squeeze" not in event_types
    ):
        return "expansionary"

    return "normal"


def build_agent_orders(
    entities: List[dict],
    price: float,
    event_modifiers: Dict[str, float],
    market_context: dict,
) -> Dict[str, List[dict]]:
    buy_orders = []
    sell_orders = []
    summaries = {}
    modes = {}

    price_trend = market_context["price_trend"]
    recent_volatility = market_context["recent_volatility"]
    recent_shortage = market_context["recent_shortage"]
    event_types = market_context["event_types"]

    for entity in entities:
        entity_id = entity["entity_id"]
        entity_type = entity["entity_type"]
        strategy = entity["strategy"]
        cc = entity["cc_balance"]
        inventory = entity["scu_inventory"]
        reserve_target = entity["reserve_target_cc"]
        stress = entity["stress"]
        unmet = entity["unmet_scu_demand"]

        mode = determine_mode(entity, market_context, event_modifiers)
        modes[entity_id] = mode

        base_need = 0.0
        base_sell = 0.0
        reserve_withhold = 0.0
        participation = 1.0
        summary_parts = [mode]

        if entity_type == "individual":
            essential_need = random.uniform(0.25, 0.8)
            discretionary_need = random.uniform(0.0, 1.0)
            base_need = essential_need + discretionary_need
            base_sell = max(0.0, inventory * random.uniform(0.02, 0.10))

            if strategy == "cautious":
                base_need *= 0.82
                reserve_withhold += inventory * 0.08
            elif strategy == "trend":
                base_need *= 1.0 + max(0.0, price_trend * 2.4)
            elif strategy == "scarcity":
                base_need *= 1.0 + max(0.0, recent_shortage * 1.8 + event_modifiers["demand"])
            elif strategy == "opportunist":
                if price_trend < -0.02:
                    base_need *= 1.35
                else:
                    base_need *= random.uniform(0.8, 1.2)

        elif entity_type == "small_corp":
            base_need = random.uniform(2.0, 6.5)
            base_sell = max(0.0, inventory * random.uniform(0.08, 0.24))

            if strategy == "reserve-heavy":
                reserve_withhold += inventory * 0.14
            elif strategy == "expansion":
                base_need *= 1.18
            elif strategy == "reactive":
                base_need *= 1.0 + max(0.0, recent_shortage * 1.5 + event_modifiers["demand"])
            elif strategy == "balanced":
                base_sell *= 1.05

        elif entity_type == "large_business":
            base_need = random.uniform(7.0, 18.0)
            base_sell = max(0.0, inventory * random.uniform(0.10, 0.30))

            if strategy == "stabilizer":
                if recent_shortage > 0.12 or price > market_context["mean_price"] * 1.08:
                    base_sell += inventory * 0.12
                    summary_parts.append("stabilizing_sell")
            elif strategy == "aggressive":
                base_need *= 1.25
                if price_trend > 0.01:
                    base_need *= 1.15
            elif strategy == "accumulator":
                reserve_withhold += inventory * 0.18
                if price_trend < -0.03:
                    base_need *= 1.30
            elif strategy == "defensive":
                base_need *= 0.80
                reserve_withhold += inventory * 0.25

        # Event-sensitive behavior
        if "speculative_chatter" in event_types and strategy in {"trend", "aggressive", "opportunist"}:
            base_need *= 1.22
            summary_parts.append("speculative")

        if "confidence_shock" in event_types:
            participation *= 0.86
            reserve_withhold += inventory * 0.05
            summary_parts.append("confidence_pullback")

        if "panic_hoarding" in event_types:
            participation *= 0.70
            reserve_withhold += inventory * 0.18
            base_need *= 0.72
            summary_parts.append("hoarding")

        if "flash_liquidity_vacuum" in event_types:
            participation *= 0.74
            summary_parts.append("thin_market")

        # Liquidity pressure
        if cc < reserve_target:
            reserve_gap_ratio = (reserve_target - cc) / max(reserve_target, 1.0)
            base_need *= 1.0 - clamp(reserve_gap_ratio, 0.0, 0.82)
            base_sell += inventory * clamp(reserve_gap_ratio * 0.40, 0.0, 0.35)
            summary_parts.append("preserving_cc")

        # State modes
        if mode == "defensive":
            base_need *= 0.62
            reserve_withhold += inventory * 0.12
            base_sell += inventory * 0.08
            participation *= 0.84

        elif mode == "panic":
            base_need *= 0.18
            reserve_withhold = max(0.0, reserve_withhold - inventory * 0.08)
            base_sell += inventory * 0.28
            participation *= 0.62

        elif mode == "opportunistic":
            if price_trend < -0.02:
                base_need *= 1.55
            else:
                base_need *= 1.20
            base_sell *= 0.70
            participation *= 1.05

        elif mode == "expansionary":
            base_need *= 1.35
            base_sell *= 0.92
            participation *= 1.08

        # Persistent shortage memory
        if unmet > 0:
            base_need += unmet * 0.55
            summary_parts.append("replenish_shortage")

        # Volatility and shortage nonlinearities
        if recent_volatility > 0.10:
            participation *= 0.88
            if mode not in {"opportunistic", "expansionary"}:
                base_need *= 0.90
                reserve_withhold += inventory * 0.04

        if recent_shortage > 0.22:
            if cc > reserve_target * 1.1:
                base_need *= 1.12
            reserve_withhold += inventory * 0.07

        # Global event modifiers
        base_need *= 1.0 + max(-0.25, event_modifiers["demand"])
        base_sell *= 1.0 - min(0.22, event_modifiers["supply"])

        participation = clamp(participation, 0.20, 1.25)

        max_affordable = cc / max(price, 0.01)
        buy_qty = max(0.0, min(base_need, max_affordable * 0.55)) * participation
        available_inventory = max(0.0, inventory - reserve_withhold)
        sell_qty = max(0.0, min(base_sell, available_inventory)) * participation

        # More heterogeneity
        buy_qty *= random.uniform(0.88, 1.15)
        sell_qty *= random.uniform(0.88, 1.15)

        if buy_qty > 0.02:
            buy_orders.append({"entity_id": entity_id, "quantity": round(buy_qty, 4)})

        if sell_qty > 0.02:
            sell_orders.append({"entity_id": entity_id, "quantity": round(sell_qty, 4)})

        summaries[entity_id] = ", ".join(summary_parts)

    return {
        "buy_orders": buy_orders,
        "sell_orders": sell_orders,
        "summaries": summaries,
        "modes": modes,
    }