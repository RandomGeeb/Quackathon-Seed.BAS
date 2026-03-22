from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.stocks import router as stocks_router

from app.config import settings
from app.db import init_db
from app.seed import seed_if_empty
from app.api.world import router as world_router
from app.api.actions import router as actions_router
from app.api.history import router as history_router
from app.api.admin import router as admin_router
from app.sim.engine import SimulationEngine


engine = SimulationEngine()


@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    if settings.auto_seed_if_empty:
        seed_if_empty()
    await engine.start()
    yield
    await engine.stop()


app = FastAPI(title=settings.app_name, lifespan=lifespan)
app.include_router(stocks_router, prefix="/api")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000", "http://localhost:3001", "http://127.0.0.1:3001"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(world_router, prefix="/api")
app.include_router(actions_router, prefix="/api")
app.include_router(history_router, prefix="/api")
app.include_router(admin_router, prefix="/api")


@app.get("/")
def root():
    return {
        "name": settings.app_name,
        "status": "running",
        "docs": "/docs",
    }