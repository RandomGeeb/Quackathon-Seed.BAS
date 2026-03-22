from fastapi import APIRouter
from app.db import db_cursor
from app.schemas import ExecutedActionRecord, SystemLogRecord

router = APIRouter()


@router.get("/history/actions", response_model=list[ExecutedActionRecord])
def get_executed_actions(limit: int = 100):
    with db_cursor() as (conn, cur):
        cur.execute(
            """
            SELECT *
            FROM executed_actions
            ORDER BY id DESC
            LIMIT ?
            """,
            (limit,),
        )
        rows = cur.fetchall()
        return [ExecutedActionRecord(**dict(row)) for row in rows]


@router.get("/history/system-log", response_model=list[SystemLogRecord])
def get_system_log(limit: int = 100):
    with db_cursor() as (conn, cur):
        cur.execute(
            """
            SELECT *
            FROM system_log
            ORDER BY id DESC
            LIMIT ?
            """,
            (limit,),
        )
        rows = cur.fetchall()
        return [SystemLogRecord(**dict(row)) for row in rows]


@router.get("/history/queued-actions")
def get_queued_actions(limit: int = 100):
    with db_cursor() as (conn, cur):
        cur.execute(
            """
            SELECT *
            FROM action_queue
            ORDER BY id DESC
            LIMIT ?
            """,
            (limit,),
        )
        rows = [dict(r) for r in cur.fetchall()]
        return rows