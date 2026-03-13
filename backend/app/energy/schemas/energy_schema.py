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
