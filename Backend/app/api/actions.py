import json
from fastapi import APIRouter, HTTPException
from app.schemas import BuyStockRequest, SellStockRequest

from app.db import db_cursor
from app.schemas import (
    TransferCCRequest,
    BuySCURequest,
    SellSCURequest,
    WithholdSCURequest,
    LiquidateRequest,
    QueueActionResponse,
)

router = APIRouter()


def _queue_action(
    action_type: str,
    actor_entity_id: int | None,
    target_entity_id: int | None,
    payload: dict,
    source: str = "manual",
) -> QueueActionResponse:
    with db_cursor() as (conn, cur):
        cur.execute("SELECT current_tick FROM world_state WHERE id = 1")
        current_tick = cur.fetchone()["current_tick"]
        execute_on_tick = current_tick + 1

        cur.execute(
            """
            INSERT INTO action_queue (
                submitted_tick, execute_on_tick, actor_entity_id, target_entity_id,
                action_type, payload_json, status, source
            )
            VALUES (?, ?, ?, ?, ?, ?, 'pending', ?)
            """,
            (
                current_tick,
                execute_on_tick,
                actor_entity_id,
                target_entity_id,
                action_type,
                json.dumps(payload),
                source,
            ),
        )
        action_id = cur.lastrowid

    return QueueActionResponse(
        queued=True,
        action_id=action_id,
        execute_on_tick=execute_on_tick,
        action_type=action_type,
    )


def _entity_exists(entity_id: int) -> bool:
    with db_cursor() as (conn, cur):
        cur.execute("SELECT 1 FROM entities WHERE id = ?", (entity_id,))
        return cur.fetchone() is not None


@router.post("/actions/transfer-cc", response_model=QueueActionResponse)
def transfer_cc(req: TransferCCRequest):
    if req.actor_entity_id == req.target_entity_id:
        raise HTTPException(status_code=400, detail="actor and target must differ")
    if not _entity_exists(req.actor_entity_id) or not _entity_exists(req.target_entity_id):
        raise HTTPException(status_code=404, detail="entity not found")

    return _queue_action(
        "transfer_cc",
        req.actor_entity_id,
        req.target_entity_id,
        {"amount": req.amount},
    )


@router.post("/actions/buy-scu", response_model=QueueActionResponse)
def buy_scu(req: BuySCURequest):
    if not _entity_exists(req.actor_entity_id):
        raise HTTPException(status_code=404, detail="entity not found")

    return _queue_action(
        "manual_buy_scu",
        req.actor_entity_id,
        None,
        {"quantity": req.quantity},
    )


@router.post("/actions/sell-scu", response_model=QueueActionResponse)
def sell_scu(req: SellSCURequest):
    if not _entity_exists(req.actor_entity_id):
        raise HTTPException(status_code=404, detail="entity not found")

    return _queue_action(
        "manual_sell_scu",
        req.actor_entity_id,
        None,
        {"quantity": req.quantity},
    )


@router.post("/actions/withhold-scu", response_model=QueueActionResponse)
def withhold_scu(req: WithholdSCURequest):
    if not _entity_exists(req.actor_entity_id):
        raise HTTPException(status_code=404, detail="entity not found")

    return _queue_action(
        "withhold_scu",
        req.actor_entity_id,
        None,
        {"quantity": req.quantity},
    )


@router.post("/actions/liquidate", response_model=QueueActionResponse)
def liquidate(req: LiquidateRequest):
    if not _entity_exists(req.actor_entity_id):
        raise HTTPException(status_code=404, detail="entity not found")

    return _queue_action(
        "liquidate_cau",
        req.actor_entity_id,
        None,
        {"cau_to_sell": req.cau_to_sell},
    )

@router.post("/actions/buy-stock", response_model=QueueActionResponse)
def buy_stock(req: BuyStockRequest):
    if not _entity_exists(req.actor_entity_id):
        raise HTTPException(status_code=404, detail="entity not found")

    with db_cursor() as (conn, cur):
        cur.execute("SELECT id FROM listed_stocks WHERE ticker = ? AND is_active = 1", (req.stock_ticker.upper(),))
        row = cur.fetchone()
        if row is None:
            raise HTTPException(status_code=404, detail="stock not found")

    return _queue_action(
        "manual_buy_stock",
        req.actor_entity_id,
        None,
        {"stock_ticker": req.stock_ticker.upper(), "quantity": req.quantity},
    )


@router.post("/actions/sell-stock", response_model=QueueActionResponse)
def sell_stock(req: SellStockRequest):
    if not _entity_exists(req.actor_entity_id):
        raise HTTPException(status_code=404, detail="entity not found")

    with db_cursor() as (conn, cur):
        cur.execute("SELECT id FROM listed_stocks WHERE ticker = ? AND is_active = 1", (req.stock_ticker.upper(),))
        row = cur.fetchone()
        if row is None:
            raise HTTPException(status_code=404, detail="stock not found")

    return _queue_action(
        "manual_sell_stock",
        req.actor_entity_id,
        None,
        {"stock_ticker": req.stock_ticker.upper(), "quantity": req.quantity},
    )