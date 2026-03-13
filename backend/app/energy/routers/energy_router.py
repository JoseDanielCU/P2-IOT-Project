from datetime import date

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.auth.dependencies import get_current_user
from app.auth.models import User
from app.core.database import SessionLocal
from app.energy.schemas import (
    ChartDataResponse,
    DailyMetricsResponse,
    EnergyDataCreate,
)
from app.energy.services import energy_service


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


router = APIRouter(prefix="/api/energy", tags=["energy"])


@router.get("/metrics/today", response_model=DailyMetricsResponse)
def get_today_metrics(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Obtiene los totales de energía del día actual"""
    metrics = energy_service.get_daily_metrics(db, current_user.id)
    metrics['user_role'] = current_user.primary_role.value
    return DailyMetricsResponse(**metrics)


@router.get("/metrics/date", response_model=DailyMetricsResponse)
def get_date_metrics(
    target_date: date = Query(..., description="Fecha en formato YYYY-MM-DD"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Obtiene los totales de energía para una fecha específica"""
    metrics = energy_service.get_daily_metrics(db, current_user.id, target_date)
    metrics['user_role'] = current_user.primary_role.value
    return DailyMetricsResponse(**metrics)


@router.get("/chart", response_model=ChartDataResponse)
def get_chart_data(
    days: int = Query(7, ge=1, le=90, description="Número de días para mostrar"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Obtiene datos para gráfica de producción vs consumo"""
    chart_data = energy_service.get_chart_data(db, current_user.id, days)

    # Calcular métricas del período
    total_produced = sum(point["produced"] for point in chart_data)
    total_consumed = sum(point["consumed"] for point in chart_data)
    net_balance = total_produced - total_consumed

    metrics = DailyMetricsResponse(
        total_produced_kwh=total_produced,
        total_consumed_kwh=total_consumed,
        net_balance_kwh=net_balance,
    )

    return ChartDataResponse(
        metrics=metrics,
        chart_data=chart_data,
        user_role=current_user.primary_role.value,
        energy_source_type=current_user.energy_source_type.value if current_user.energy_source_type else None
    )


@router.post("/record")
def create_energy_record(
    energy_data: EnergyDataCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Crea un nuevo registro de energía"""
    return energy_service.create_energy_data(db, current_user.id, energy_data)
