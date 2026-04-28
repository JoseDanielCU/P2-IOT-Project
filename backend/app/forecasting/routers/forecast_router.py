from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.auth.dependencies import get_current_user, get_db
from app.auth.models import User
from app.forecasting.schemas.forecast_schema import ForecastResponse
from app.forecasting.services import forecast_service


router = APIRouter(prefix="/api/forecasting", tags=["forecasting"])


@router.get("/predict", response_model=ForecastResponse)
def get_forecast(
    horizon: int = Query(
        7,
        description="Horizonte de predicción en días (7, 14 o 30)",
        ge=1,
        le=90,
    ),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Genera la predicción de producción y consumo para el horizonte solicitado.

    Usa regresión lineal sobre el historial del usuario.
    Tiempo de respuesta garantizado < 2 segundos para cualquier horizonte.
    """
    forecast_data = forecast_service.get_forecast(db, current_user.id, horizon)
    return ForecastResponse(
        horizon_days=horizon,
        forecast=forecast_data,
        total_points=len(forecast_data),
    )
