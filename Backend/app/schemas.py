from typing import Optional, Literal, Dict, Any
from pydantic import BaseModel, Field


class TransferCCRequest(BaseModel):
    actor_entity_id: int
    target_entity_id: int
    amount: float = Field(gt=0)


class BuySCURequest(BaseModel):
    actor_entity_id: int
    quantity: float = Field(gt=0)


class SellSCURequest(BaseModel):
    actor_entity_id: int
    quantity: float = Field(gt=0)


class WithholdSCURequest(BaseModel):
    actor_entity_id: int
    quantity: float = Field(ge=0)


class LiquidateRequest(BaseModel):
    actor_entity_id: int
    cau_to_sell: float = Field(gt=0)


class TriggerEventRequest(BaseModel):
    event_type: Literal[
        "demand_surge",
        "local_outage",
        "mood_shift",
        "liquidity_squeeze",
        "major_outage",
        "public_reserve_release",
        "policy_intervention",
        "speculative_wave",
    ]
    name: str
    description: str
    duration_ticks: int = Field(ge=1, le=50)
    supply_effect: float = 0.0
    demand_effect: float = 0.0
    volatility_effect: float = 0.0
    stress_effect: float = 0.0
    price_bias: float = 0.0


class QueueActionResponse(BaseModel):
    queued: bool
    action_id: int
    execute_on_tick: int
    action_type: str


class ExecutedActionRecord(BaseModel):
    id: int
    tick: int
    actor_entity_id: Optional[int]
    target_entity_id: Optional[int]
    action_type: str
    payload_json: str
    result_json: str
    source: str
    created_at: str


class SystemLogRecord(BaseModel):
    id: int
    tick: Optional[int]
    level: str
    message: str
    created_at: str


class BuyStockRequest(BaseModel):
    actor_entity_id: int
    stock_ticker: str
    quantity: float = Field(gt=0)


class SellStockRequest(BaseModel):
    actor_entity_id: int
    stock_ticker: str
    quantity: float = Field(gt=0)