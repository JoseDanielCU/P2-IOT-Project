from datetime import datetime

from pydantic import BaseModel, Field

from app.alerts.models.alert_config import AlertType


class AlertConfigBase(BaseModel):
    alert_type: AlertType
    threshold_kwh: float = Field(..., description="Umbral en kWh")
    is_enabled: bool = True


class AlertConfigCreate(AlertConfigBase):
    """Schema para crear o actualizar una configuración de alerta."""
    pass


class AlertConfigResponse(AlertConfigBase):
    """Schema de respuesta que incluye metadatos de la BD."""

    id: int
    user_id: int
    created_at: datetime
    updated_at: datetime | None = None

    class Config:
        from_attributes = True


class AlertConfigBulkUpdate(BaseModel):
    """Permite guardar múltiples configuraciones en una sola llamada."""

    configs: list[AlertConfigCreate]


class TriggeredAlert(BaseModel):
    """Representa una alerta disparada al comparar métricas con umbrales."""

    alert_type: AlertType
    threshold_kwh: float
    current_value_kwh: float
    message: str


class AlertCheckResponse(BaseModel):
    """Respuesta del endpoint de verificación de alertas."""

    triggered_alerts: list[TriggeredAlert]
    total_triggered: int
