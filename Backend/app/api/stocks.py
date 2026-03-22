from fastapi import APIRouter
from app.db import db_cursor

router = APIRouter()


@router.get("/stocks")
def get_stocks():
    with db_cursor() as (conn, cur):
        cur.execute(
            """
            SELECT
                id, ticker, name, archetype, current_price, previous_price,
                target_price, shares_outstanding, current_regime, regime_ticks_remaining,
                sentiment
            FROM listed_stocks
            WHERE is_active = 1
            ORDER BY ticker ASC
            """
        )
        return [dict(r) for r in cur.fetchall()]


@router.get("/stocks/history")
def get_stock_history(limit: int = 200):
    with db_cursor() as (conn, cur):
        cur.execute(
            """
            SELECT *
            FROM stock_price_history
            ORDER BY tick DESC, ticker ASC
            LIMIT ?
            """,
            (limit,),
        )
        return [dict(r) for r in cur.fetchall()]


@router.get("/stocks/{ticker}")
def get_stock_detail(ticker: str):
    with db_cursor() as (conn, cur):
        cur.execute(
            """
            SELECT *
            FROM listed_stocks
            WHERE ticker = ? AND is_active = 1
            """,
            (ticker.upper(),),
        )
        stock = cur.fetchone()

        cur.execute(
            """
            SELECT tick, price, shares_traded, volume_cc, regime, sentiment
            FROM stock_price_history
            WHERE ticker = ?
            ORDER BY tick DESC
            LIMIT 40
            """,
            (ticker.upper(),),
        )
        history = [dict(r) for r in cur.fetchall()]

        return {
            "stock": dict(stock) if stock else None,
            "history": history,
        }


@router.get("/entities/{entity_id}/stocks")
def get_entity_stocks(entity_id: int):
    with db_cursor() as (conn, cur):
        cur.execute(
            """
            SELECT
                h.entity_id,
                h.stock_id,
                ls.ticker,
                ls.name,
                h.shares_owned,
                h.avg_cost_basis,
                ls.current_price,
                (h.shares_owned * ls.current_price) AS market_value
            FROM entity_stock_holdings h
            JOIN listed_stocks ls ON ls.id = h.stock_id
            WHERE h.entity_id = ?
            ORDER BY market_value DESC
            """,
            (entity_id,),
        )
        return [dict(r) for r in cur.fetchall()]