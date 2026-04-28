from pydantic import BaseModel


class ForecastPoint(BaseModel):
    """Un punto de predicción para un día concreto."""

    date: str
    predicted_produced_kwh: float
    predicted_consumed_kwh: float


class ForecastResponse(BaseModel):
    """Respuesta completa del endpoint de forecasting."""

    horizon_days: int
    forecast: list[ForecastPoint]
    total_points: int
