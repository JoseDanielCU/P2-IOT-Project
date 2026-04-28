from sqlalchemy import Column, DateTime, Float, ForeignKey, Integer, String
from sqlalchemy.sql import func

from app.core.database import Base


class EnergyPrediction(Base):
    __tablename__ = "energy_predictions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)

    # Fecha predicha
    prediction_date = Column(DateTime, nullable=False, index=True)

    # Predicciones
    predicted_consumption_kwh = Column(Float, nullable=False, default=0.0)
    predicted_production_kwh = Column(Float, nullable=False, default=0.0)

    # Metadata
    model_version = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
