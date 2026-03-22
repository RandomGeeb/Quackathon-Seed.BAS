from fastapi import APIRouter
from app.db import db_cursor
from app.schemas import TriggerEventRequest, QueueActionResponse
from app.api.actions import _queue_action

router = APIRouter()


@router.post("/admin/events/trigger", response_model=QueueActionResponse)
def trigger_event(req: TriggerEventRequest):
    return _queue_action(
        "trigger_event",
        None,
        None,
        {
            "event_type": req.event_type,
            "name": req.name,
            "description": req.description,
            "duration_ticks": req.duration_ticks,
            "supply_effect": req.supply_effect,
            "demand_effect": req.demand_effect,
            "volatility_effect": req.volatility_effect,
            "stress_effect": req.stress_effect,
            "price_bias": req.price_bias,
        },
        source="admin",
    )


@router.post("/admin/reset")
def reset_world():
    tables = [
        "entities",
        "entity_state",
        "active_events",
        "event_history",
        "action_queue",
        "executed_actions",
        "market_trades",
        "tick_metrics",
        "entity_state_history",
        "system_log",
    ]
    with db_cursor() as (conn, cur):
        for table in tables:
            cur.execute(f"DELETE FROM {table}")
        cur.execute("UPDATE world_state SET current_tick = 0, last_tick_at = NULL WHERE id = 1")
        cur.execute(
            """
            UPDATE market_state
            SET scu_price = 10.0,
                last_total_supply = 0,
                last_total_demand = 0,
                last_traded_volume = 0,
                last_shortage_ratio = 0,
                last_volatility = 0
            WHERE id = 1
            """
        )
    from app.seed import seed_if_empty
    seed_if_empty()
    return {"ok": True, "message": "world reset and reseeded"}