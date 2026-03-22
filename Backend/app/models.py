from typing import Optional, List
from pydantic import BaseModel


class WorldSummary(BaseModel):
    current_tick: int
    tick_seconds: float
    sim_running: bool
    scu_price: float
    total_entities: int
    active_events: int


class MarketSummary(BaseModel):
    scu_price: float
    total_supply: float
    total_demand: float
    traded_volume: float
    shortage_ratio: float
    volatility: float


class EntitySummary(BaseModel):
    id: int
    name: str
    entity_type: str
    strategy: str
    size_band: str
    cc_balance: float
    cau_holdings: float
    scu_inventory: float
    scu_reserved: float
    reserve_target_cc: float
    stress: float
    unmet_scu_demand: float
    net_worth_estimate: float


class ActiveEvent(BaseModel):
    id: int
    event_type: str
    name: str
    description: str
    start_tick: int
    end_tick: int
    supply_effect: float
    demand_effect: float
    volatility_effect: float
    stress_effect: float
    price_bias: float
    source: str


class TickMetric(BaseModel):
    tick: int
    scu_price: float
    total_cc: float
    total_cau: float
    total_scu_inventory: float
    total_scu_reserved: float
    total_supply: float
    total_demand: float
    traded_volume: float
    avg_stress: float
    top_1_wealth_share: float
    top_10_wealth_share: float
    active_event_count: int


class WorldSnapshot(BaseModel):
    world: WorldSummary
    market: MarketSummary
    top_entities: List[EntitySummary]
    events: List[ActiveEvent]