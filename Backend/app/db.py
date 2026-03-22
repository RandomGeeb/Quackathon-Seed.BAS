import sqlite3
from contextlib import contextmanager
from app.config import settings


def get_connection() -> sqlite3.Connection:
    conn = sqlite3.connect(settings.db_path, check_same_thread=False)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA journal_mode=WAL;")
    conn.execute("PRAGMA foreign_keys=ON;")
    return conn


@contextmanager
def db_cursor():
    conn = get_connection()
    cur = conn.cursor()
    try:
        yield conn, cur
        conn.commit()
    except Exception:
        conn.rollback()
        raise
    finally:
        cur.close()
        conn.close()


def init_db() -> None:
    with db_cursor() as (conn, cur):
        cur.executescript(
            """
            CREATE TABLE IF NOT EXISTS world_state (
                id INTEGER PRIMARY KEY CHECK (id = 1),
                current_tick INTEGER NOT NULL DEFAULT 0,
                tick_seconds REAL NOT NULL DEFAULT 2.0,
                sim_running INTEGER NOT NULL DEFAULT 1,
                last_tick_at TEXT
            );

            CREATE TABLE IF NOT EXISTS market_state (
                id INTEGER PRIMARY KEY CHECK (id = 1),
                scu_price REAL NOT NULL,
                last_total_supply REAL NOT NULL DEFAULT 0,
                last_total_demand REAL NOT NULL DEFAULT 0,
                last_traded_volume REAL NOT NULL DEFAULT 0,
                last_shortage_ratio REAL NOT NULL DEFAULT 0,
                last_volatility REAL NOT NULL DEFAULT 0
            );

            CREATE TABLE IF NOT EXISTS entities (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                entity_type TEXT NOT NULL,
                strategy TEXT NOT NULL,
                size_band TEXT NOT NULL,
                is_active INTEGER NOT NULL DEFAULT 1
            );

            CREATE TABLE IF NOT EXISTS entity_state (
                entity_id INTEGER PRIMARY KEY,
                cc_balance REAL NOT NULL,
                cau_holdings REAL NOT NULL,
                scu_inventory REAL NOT NULL DEFAULT 0,
                scu_reserved REAL NOT NULL DEFAULT 0,
                reserve_target_cc REAL NOT NULL,
                stress REAL NOT NULL DEFAULT 0,
                unmet_scu_demand REAL NOT NULL DEFAULT 0,
                efficiency REAL NOT NULL DEFAULT 1.0,
                last_action_summary TEXT,
                net_worth_estimate REAL NOT NULL DEFAULT 0,
                FOREIGN KEY (entity_id) REFERENCES entities(id) ON DELETE CASCADE
            );

            CREATE TABLE IF NOT EXISTS active_events (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                event_type TEXT NOT NULL,
                name TEXT NOT NULL,
                description TEXT NOT NULL,
                start_tick INTEGER NOT NULL,
                end_tick INTEGER NOT NULL,
                supply_effect REAL NOT NULL DEFAULT 0,
                demand_effect REAL NOT NULL DEFAULT 0,
                volatility_effect REAL NOT NULL DEFAULT 0,
                stress_effect REAL NOT NULL DEFAULT 0,
                price_bias REAL NOT NULL DEFAULT 0,
                source TEXT NOT NULL DEFAULT 'system'
            );

            CREATE TABLE IF NOT EXISTS event_history (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                event_type TEXT NOT NULL,
                name TEXT NOT NULL,
                description TEXT NOT NULL,
                start_tick INTEGER NOT NULL,
                end_tick INTEGER NOT NULL,
                source TEXT NOT NULL
            );

            CREATE TABLE IF NOT EXISTS action_queue (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                submitted_tick INTEGER NOT NULL,
                execute_on_tick INTEGER NOT NULL,
                actor_entity_id INTEGER,
                target_entity_id INTEGER,
                action_type TEXT NOT NULL,
                payload_json TEXT NOT NULL,
                status TEXT NOT NULL DEFAULT 'pending',
                source TEXT NOT NULL DEFAULT 'system',
                created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
                processed_at TEXT
            );

            CREATE TABLE IF NOT EXISTS executed_actions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                tick INTEGER NOT NULL,
                actor_entity_id INTEGER,
                target_entity_id INTEGER,
                action_type TEXT NOT NULL,
                payload_json TEXT NOT NULL,
                result_json TEXT NOT NULL,
                source TEXT NOT NULL,
                created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
            );

            CREATE TABLE IF NOT EXISTS market_trades (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                tick INTEGER NOT NULL,
                entity_id INTEGER NOT NULL,
                side TEXT NOT NULL,
                requested_quantity REAL NOT NULL,
                filled_quantity REAL NOT NULL,
                price REAL NOT NULL,
                notional_cc REAL NOT NULL,
                created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (entity_id) REFERENCES entities(id)
            );

            CREATE TABLE IF NOT EXISTS tick_metrics (
                tick INTEGER PRIMARY KEY,
                scu_price REAL NOT NULL,
                total_cc REAL NOT NULL,
                total_cau REAL NOT NULL,
                total_scu_inventory REAL NOT NULL,
                total_scu_reserved REAL NOT NULL,
                total_supply REAL NOT NULL,
                total_demand REAL NOT NULL,
                traded_volume REAL NOT NULL,
                avg_stress REAL NOT NULL,
                top_1_wealth_share REAL NOT NULL,
                top_10_wealth_share REAL NOT NULL,
                active_event_count INTEGER NOT NULL,
                created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
            );

            CREATE TABLE IF NOT EXISTS entity_state_history (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                tick INTEGER NOT NULL,
                entity_id INTEGER NOT NULL,
                cc_balance REAL NOT NULL,
                cau_holdings REAL NOT NULL,
                scu_inventory REAL NOT NULL,
                scu_reserved REAL NOT NULL,
                reserve_target_cc REAL NOT NULL,
                stress REAL NOT NULL,
                unmet_scu_demand REAL NOT NULL,
                net_worth_estimate REAL NOT NULL,
                FOREIGN KEY (entity_id) REFERENCES entities(id)
            );

            CREATE TABLE IF NOT EXISTS system_log (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                tick INTEGER,
                level TEXT NOT NULL,
                message TEXT NOT NULL,
                created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
            );
            """
        )

        cur.execute("INSERT OR IGNORE INTO world_state (id, current_tick, tick_seconds, sim_running) VALUES (1, 0, ?, 1)", (settings.tick_seconds,))
        cur.execute(
            "INSERT OR IGNORE INTO market_state (id, scu_price, last_total_supply, last_total_demand, last_traded_volume, last_shortage_ratio, last_volatility) VALUES (1, ?, 0, 0, 0, 0, 0)",
            (settings.base_scu_price,),
        )

        cur.executescript(
            """
            CREATE TABLE IF NOT EXISTS listed_stocks (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                ticker TEXT NOT NULL UNIQUE,
                name TEXT NOT NULL,
                archetype TEXT NOT NULL,
                current_price REAL NOT NULL,
                previous_price REAL NOT NULL,
                target_price REAL NOT NULL,
                shares_outstanding REAL NOT NULL,
                base_drift REAL NOT NULL DEFAULT 0,
                volatility REAL NOT NULL DEFAULT 0.02,
                soft_floor REAL NOT NULL DEFAULT 1.0,
                soft_ceiling REAL NOT NULL DEFAULT 100.0,
                momentum_factor REAL NOT NULL DEFAULT 0.5,
                mean_reversion_factor REAL NOT NULL DEFAULT 0.02,
                breakout_chance REAL NOT NULL DEFAULT 0.01,
                breakout_strength REAL NOT NULL DEFAULT 0.03,
                crash_chance REAL NOT NULL DEFAULT 0.01,
                crash_severity REAL NOT NULL DEFAULT 0.08,
                dependency_json TEXT,
                current_regime TEXT NOT NULL DEFAULT 'normal',
                regime_ticks_remaining INTEGER NOT NULL DEFAULT 0,
                sentiment REAL NOT NULL DEFAULT 0,
                is_active INTEGER NOT NULL DEFAULT 1
            );

            CREATE TABLE IF NOT EXISTS entity_stock_holdings (
                entity_id INTEGER NOT NULL,
                stock_id INTEGER NOT NULL,
                shares_owned REAL NOT NULL,
                avg_cost_basis REAL NOT NULL,
                PRIMARY KEY (entity_id, stock_id),
                FOREIGN KEY (entity_id) REFERENCES entities(id) ON DELETE CASCADE,
                FOREIGN KEY (stock_id) REFERENCES listed_stocks(id) ON DELETE CASCADE
            );

            CREATE TABLE IF NOT EXISTS stock_price_history (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                tick INTEGER NOT NULL,
                stock_id INTEGER NOT NULL,
                ticker TEXT NOT NULL,
                price REAL NOT NULL,
                shares_traded REAL NOT NULL DEFAULT 0,
                volume_cc REAL NOT NULL DEFAULT 0,
                regime TEXT NOT NULL,
                sentiment REAL NOT NULL DEFAULT 0,
                created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (stock_id) REFERENCES listed_stocks(id)
            );

            CREATE TABLE IF NOT EXISTS stock_trades (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                tick INTEGER NOT NULL,
                entity_id INTEGER NOT NULL,
                stock_id INTEGER NOT NULL,
                ticker TEXT NOT NULL,
                side TEXT NOT NULL,
                requested_quantity REAL NOT NULL,
                filled_quantity REAL NOT NULL,
                price REAL NOT NULL,
                notional_cc REAL NOT NULL,
                created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (entity_id) REFERENCES entities(id),
                FOREIGN KEY (stock_id) REFERENCES listed_stocks(id)
            );
            """
        )

        