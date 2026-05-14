import asyncio
import logging

# WebSocket
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text

from app.alerts import router as alerts_router
from app.auth import router as auth_router
from app.auth.routers.user_router import router as user_router
from app.core.config import CORS_CREDENTIALS, CORS_HEADERS, CORS_METHODS, CORS_ORIGINS
from app.core.database import Base, engine
from app.energy import router as energy_router
from app.forecasting import router as forecasting_router


class AlertConnectionManager:
    def __init__(self):
        self.active_connections: list[WebSocket] = []
        self.alert_queue: asyncio.Queue = asyncio.Queue()

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)

    async def broadcast_alerts(self):
        while True:
            alert_data = await self.alert_queue.get()
            disconnected = []
            for ws in self.active_connections:
                try:
                    await ws.send_json(alert_data)
                except Exception:
                    disconnected.append(ws)
            for ws in disconnected:
                self.disconnect(ws)

    async def send_alert(self, alert_data: dict):
        await self.alert_queue.put(alert_data)


alert_manager = AlertConnectionManager()

logger = logging.getLogger(__name__)

Base.metadata.create_all(bind=engine)

app = FastAPI(title="Comunidad Energética API")


@app.on_event("startup")
async def startup_event():
    asyncio.create_task(alert_manager.broadcast_alerts())
    _run_migrations()


def _run_migrations():
    try:
        with engine.connect() as conn:
            conn.execute(
                text(
                    "ALTER TABLE alert_configurations "
                    "ADD COLUMN IF NOT EXISTS notify_email BOOLEAN NOT NULL DEFAULT FALSE"
                )
            )
            conn.commit()
            logger.info("Migration: columna notify_email agregada/verificada")
    except Exception as e:
        logger.warning("Migration (notify_email) omitida: %s", e)


app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=CORS_CREDENTIALS,
    allow_methods=CORS_METHODS,
    allow_headers=CORS_HEADERS,
)

app.include_router(auth_router)
app.include_router(user_router)
app.include_router(energy_router)
# HU-COM-07: Rutas de configuración de alertas personalizadas
app.include_router(alerts_router)
# HU-IA-05: Rutas de forecasting con selector de horizonte
app.include_router(forecasting_router)


# WebSocket para alertas en tiempo real
@app.websocket("/ws/alerts")
async def websocket_alerts(websocket: WebSocket):
    await alert_manager.connect(websocket)
    try:
        while True:
            await asyncio.sleep(3600)
    except WebSocketDisconnect:
        alert_manager.disconnect(websocket)
    except asyncio.CancelledError:
        alert_manager.disconnect(websocket)
