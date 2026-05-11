import enum

from sqlalchemy import Boolean, Column, DateTime, Enum, Float, ForeignKey, Integer
from sqlalchemy.sql import func

from app.core.database import Base


class AlertType(enum.StrEnum):
    """Tipos de umbral que un usuario puede configurar."""

    production_high = "production_high"  # producción supera el umbral
    production_low = "production_low"  # producción cae bajo el umbral
    consumption_high = "consumption_high"  # consumo supera el umbral
    consumption_low = "consumption_low"  # consumo cae bajo el umbral
    balance_low = "balance_low"  # balance neto cae bajo el umbral


class AlertConfiguration(Base):
    """Configuración de alerta personalizada por usuario y tipo."""

    __tablename__ = "alert_configurations"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)

    # Tipo de alerta y umbral asociado
    alert_type = Column(Enum(AlertType), nullable=False)
    threshold_kwh = Column(Float, nullable=False)

    # El usuario puede activar o desactivar cada alerta individualmente
    is_enabled = Column(Boolean, nullable=False, default=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
