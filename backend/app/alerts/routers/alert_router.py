from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.alerts.schemas.alert_schema import (
    AlertCheckResponse,
    AlertConfigBulkUpdate,
    AlertConfigResponse,
)
from app.alerts.services import alert_service
from app.auth.dependencies import get_current_user, get_db
from app.auth.models import User
from app.energy.services import energy_service


router = APIRouter(prefix="/api/alerts", tags=["alerts"])


@router.get("/", response_model=list[AlertConfigResponse])
def get_alert_configs(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Devuelve todas las configuraciones de alerta del usuario autenticado."""
    return alert_service.get_user_alert_configs(db, current_user.id)


@router.put("/", response_model=list[AlertConfigResponse])
def save_alert_configs(
    payload: AlertConfigBulkUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Guarda (crea o actualiza) las configuraciones de alerta del usuario."""
    return alert_service.upsert_alert_configs(db, current_user.id, payload.configs)


@router.get("/check", response_model=AlertCheckResponse)
def check_current_alerts(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Verifica las métricas del día actual contra los umbrales del usuario."""
    metrics = energy_service.get_daily_metrics(db, current_user.id)
    triggered = alert_service.check_alerts(db, current_user.id, metrics)
    return AlertCheckResponse(
        triggered_alerts=triggered,
        total_triggered=len(triggered),
    )
