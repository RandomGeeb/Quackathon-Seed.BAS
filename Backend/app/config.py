from pydantic import BaseModel
from pathlib import Path


class Settings(BaseModel):
    app_name: str = "Compute Economy Sim"
    db_path: str = str(Path(__file__).resolve().parent.parent / "data" / "sim.db")
    tick_seconds: float = 2.0
    auto_seed_if_empty: bool = True
    entity_count: int = 150
    base_scu_price: float = 10.0
    max_event_modifier: float = 0.9


settings = Settings()