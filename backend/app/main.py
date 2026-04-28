from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.alerts import router as alerts_router
from app.auth import router as auth_router
from app.auth.routers.user_router import router as user_router
from app.core.config import CORS_CREDENTIALS, CORS_HEADERS, CORS_METHODS, CORS_ORIGINS
from app.core.database import Base, engine
from app.energy import router as energy_router
from app.forecasting import router as forecasting_router


Base.metadata.create_all(bind=engine)

app = FastAPI(title="Comunidad Energética API")

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
