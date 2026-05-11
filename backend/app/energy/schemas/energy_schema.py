import datetime

from pydantic import BaseModel, Field


class EnergyDataCreate(BaseModel):
    timestamp: datetime.datetime
    energy_produced_kwh: float = Field(..., ge=0)
    energy_consumed_kwh: float = Field(..., ge=0)


class EnergyDataResponse(BaseModel):
    id: int
    user_id: int
    timestamp: datetime.datetime
    energy_produced_kwh: float
    energy_consumed_kwh: float

    class Config:
        from_attributes = True


class DailyMetricsResponse(BaseModel):
    total_produced_kwh: float
    total_consumed_kwh: float
    net_balance_kwh: float
    user_role: str | None = None


class ChartDataPoint(BaseModel):
    timestamp: str
    produced: float
    consumed: float


class ChartDataResponse(BaseModel):
    metrics: DailyMetricsResponse
    chart_data: list[ChartDataPoint]
    user_role: str
    energy_source_type: str | None = None


class PredictionDataPoint(BaseModel):
    """Punto de datos de predicción para visualización en gráficas"""

    timestamp: str
    predicted_consumed: float
    predicted_produced: float
    is_prediction: bool = True  # Bandera para distinguir predicciones de datos reales


class PredictionResponse(BaseModel):
    """Respuesta con predicciones para los próximos días"""

    id: int
    user_id: int
    prediction_date: datetime.datetime
    predicted_consumption_kwh: float
    predicted_production_kwh: float
    created_at: datetime.datetime

    class Config:
        from_attributes = True


class PredictionForecastResponse(BaseModel):
    """Respuesta con pronóstico completo (histórico + predicciones)"""

    historical_data: list[ChartDataPoint]  # Datos reales del pasado
    predictions: list[PredictionDataPoint]  # Predicciones futuras
    metrics: dict  # Métricas del período
    forecast_period_days: int = 7
    generation_date: datetime.datetime
