from fastapi import APIRouter
from app.db import db_cursor
from app.models import WorldSummary, MarketSummary, EntitySummary, ActiveEvent, TickMetric, WorldSnapshot

router = APIRouter()


@router.get("/world", response_model=WorldSummary)
def get_world():
    with db_cursor() as (conn, cur):
        cur.execute("SELECT * FROM world_state WHERE id = 1")
        world = cur.fetchone()

        cur.execute("SELECT * FROM market_state WHERE id = 1")
        market = cur.fetchone()

        cur.execute("SELECT COUNT(*) AS c FROM entities WHERE is_active = 1")
        total_entities = cur.fetchone()["c"]

        cur.execute("SELECT COUNT(*) AS c FROM active_events")
        active_events = cur.fetchone()["c"]

        return WorldSummary(
            current_tick=world["current_tick"],
            tick_seconds=world["tick_seconds"],
            sim_running=bool(world["sim_running"]),
            scu_price=market["scu_price"],
            total_entities=total_entities,
            active_events=active_events,
        )


@router.get("/market", response_model=MarketSummary)
def get_market():
    with db_cursor() as (conn, cur):
        cur.execute("SELECT * FROM market_state WHERE id = 1")
        row = cur.fetchone()

        return MarketSummary(
            scu_price=row["scu_price"],
            total_supply=row["last_total_supply"],
            total_demand=row["last_total_demand"],
            traded_volume=row["last_traded_volume"],
            shortage_ratio=row["last_shortage_ratio"],
            volatility=row["last_volatility"],
        )


@router.get("/entities", response_model=list[EntitySummary])
def get_entities(limit: int = 50):
    with db_cursor() as (conn, cur):
        cur.execute(
            """
            SELECT
                e.id, e.name, e.entity_type, e.strategy, e.size_band,
                s.cc_balance, s.cau_holdings, s.scu_inventory, s.scu_reserved,
                s.reserve_target_cc, s.stress, s.unmet_scu_demand, s.net_worth_estimate
            FROM entities e
            JOIN entity_state s ON s.entity_id = e.id
            WHERE e.is_active = 1
            ORDER BY s.net_worth_estimate DESC
            LIMIT ?
            """,
            (limit,),
        )
        rows = cur.fetchall()

        return [EntitySummary(**dict(row)) for row in rows]


@router.get("/entities/{entity_id}", response_model=EntitySummary)
def get_entity(entity_id: int):
    with db_cursor() as (conn, cur):
        cur.execute(
            """
            SELECT
                e.id, e.name, e.entity_type, e.strategy, e.size_band,
                s.cc_balance, s.cau_holdings, s.scu_inventory, s.scu_reserved,
                s.reserve_target_cc, s.stress, s.unmet_scu_demand, s.net_worth_estimate
            FROM entities e
            JOIN entity_state s ON s.entity_id = e.id
            WHERE e.id = ?
            """,
            (entity_id,),
        )
        row = cur.fetchone()
        return EntitySummary(**dict(row))


@router.get("/events/active", response_model=list[ActiveEvent])
def get_active_events():
    with db_cursor() as (conn, cur):
        cur.execute("SELECT * FROM active_events ORDER BY end_tick ASC")
        rows = cur.fetchall()
        return [ActiveEvent(**dict(row)) for row in rows]


@router.get("/history/ticks", response_model=list[TickMetric])
def get_tick_history(limit: int = 50):
    with db_cursor() as (conn, cur):
        cur.execute(
            """
            SELECT *
            FROM tick_metrics
            ORDER BY tick DESC
            LIMIT ?
            """,
            (limit,),
        )
        rows = cur.fetchall()
        return [TickMetric(**dict(row)) for row in rows]


@router.get("/snapshot", response_model=WorldSnapshot)
def get_snapshot():
    with db_cursor() as (conn, cur):
        cur.execute("SELECT * FROM world_state WHERE id = 1")
        world = cur.fetchone()

        cur.execute("SELECT * FROM market_state WHERE id = 1")
        market = cur.fetchone()

        cur.execute("SELECT COUNT(*) AS c FROM entities WHERE is_active = 1")
        total_entities = cur.fetchone()["c"]

        cur.execute("SELECT COUNT(*) AS c FROM active_events")
        active_event_count = cur.fetchone()["c"]

        cur.execute(
            """
            SELECT
                e.id, e.name, e.entity_type, e.strategy, e.size_band,
                s.cc_balance, s.cau_holdings, s.scu_inventory, s.scu_reserved,
                s.reserve_target_cc, s.stress, s.unmet_scu_demand, s.net_worth_estimate
            FROM entities e
            JOIN entity_state s ON s.entity_id = e.id
            WHERE e.is_active = 1
            ORDER BY s.net_worth_estimate DESC
            LIMIT 15
            """
        )
        top_entities = [EntitySummary(**dict(row)) for row in cur.fetchall()]

        cur.execute("SELECT * FROM active_events ORDER BY end_tick ASC")
        events = [ActiveEvent(**dict(row)) for row in cur.fetchall()]

        return WorldSnapshot(
            world=WorldSummary(
                current_tick=world["current_tick"],
                tick_seconds=world["tick_seconds"],
                sim_running=bool(world["sim_running"]),
                scu_price=market["scu_price"],
                total_entities=total_entities,
                active_events=active_event_count,
            ),
            market=MarketSummary(
                scu_price=market["scu_price"],
                total_supply=market["last_total_supply"],
                total_demand=market["last_total_demand"],
                traded_volume=market["last_traded_volume"],
                shortage_ratio=market["last_shortage_ratio"],
                volatility=market["last_volatility"],
            ),
            top_entities=top_entities,
            events=events,
        )