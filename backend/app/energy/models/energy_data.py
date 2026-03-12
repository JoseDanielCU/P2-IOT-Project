from sqlalchemy import Column, Date, DateTime, Float, ForeignKey, Integer
from sqlalchemy.sql import func

from app.core.database import Base


class EnergyData(Base):
    __tablename__ = "energy_data"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    
    # Datos de energía
    timestamp = Column(DateTime, nullable=False, index=True)
    energy_produced_kwh = Column(Float, nullable=False, default=0.0)
    energy_consumed_kwh = Column(Float, nullable=False, default=0.0)
    
    # Datos del sistema
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
