import random
from typing import Dict, List


def clamp(value: float, low: float, high: float) -> float:
    return max(low, min(high, value))


def build_agent_orders(entities: List[dict], price: float, event_modifiers: Dict[str, float]) -> Dict[str, List[dict]]:
    buy_orders = []
    sell_orders = []
    summaries = {}

    for entity in entities:
        entity_id = entity["entity_id"]
        entity_type = entity["entity_type"]
        strategy = entity["strategy"]
        cc = entity["cc_balance"]
        cau = entity["cau_holdings"]
        inventory = entity["scu_inventory"]
        reserve_target = entity["reserve_target_cc"]
        stress = entity["stress"]
        unmet = entity["unmet_scu_demand"]

        base_need = 0.0
        base_sell = 0.0
        reserve_withhold = 0.0
        summary_parts = []

        if entity_type == "individual":
            base_need = random.uniform(0.3, 1.4)
            if strategy == "cautious":
                base_need *= 0.8
            elif strategy == "trend":
                base_need *= 1.0 + max(0, event_modifiers["price_bias"])
            elif strategy == "scarcity":
                base_need *= 1.0 + max(0, event_modifiers["demand"])
            elif strategy == "opportunist":
                base_need *= random.uniform(0.7, 1.3)

        elif entity_type == "small_corp":
            base_need = random.uniform(2.5, 6.0)
            base_sell = max(0.0, inventory * random.uniform(0.05, 0.18))
            if strategy == "reserve-heavy":
                reserve_withhold = inventory * 0.10
            elif strategy == "expansion":
                base_need *= 1.15
            elif strategy == "reactive":
                base_need *= 1.0 + max(0, event_modifiers["demand"])

        elif entity_type == "large_business":
            base_need = random.uniform(8.0, 20.0)
            base_sell = max(0.0, inventory * random.uniform(0.08, 0.25))
            if strategy == "stabilizer":
                base_sell += inventory * 0.05 if price > 12 else 0
            elif strategy == "aggressive":
                base_need *= 1.2
            elif strategy == "accumulator":
                base_need *= 1.1
                reserve_withhold = inventory * 0.15
            elif strategy == "defensive":
                base_need *= 0.85
                reserve_withhold = inventory * 0.2

        if cc < reserve_target:
            reserve_gap_ratio = (reserve_target - cc) / max(reserve_target, 1)
            base_need *= 1.0 - clamp(reserve_gap_ratio, 0.0, 0.7)
            base_sell += inventory * clamp(reserve_gap_ratio * 0.25, 0.0, 0.25)
            summary_parts.append("preserving_cc")

        if stress > 0.6:
            base_need *= 0.7
            base_sell += inventory * 0.10
            summary_parts.append("stress_sell")

        if unmet > 0:
            base_need += unmet * 0.35
            summary_parts.append("replenish_shortage")

        max_affordable = cc / max(price, 0.01)
        buy_qty = max(0.0, min(base_need, max_affordable * 0.35))
        sell_qty = max(0.0, min(base_sell, max(0.0, inventory - reserve_withhold)))

        if buy_qty > 0.01:
            buy_orders.append({"entity_id": entity_id, "quantity": round(buy_qty, 4)})

        if sell_qty > 0.01:
            sell_orders.append({"entity_id": entity_id, "quantity": round(sell_qty, 4)})

        summaries[entity_id] = ", ".join(summary_parts) if summary_parts else "routine"

    return {"buy_orders": buy_orders, "sell_orders": sell_orders, "summaries": summaries}