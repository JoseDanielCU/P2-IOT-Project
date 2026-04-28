from datetime import date

from fastapi import APIRouter, Depends, File, HTTPException, Query, UploadFile
from sqlalchemy.orm import Session

from app.auth.dependencies import get_current_user
from app.auth.models import User
from app.core.database import SessionLocal
from app.energy.schemas import (
    ChartDataResponse,
    DailyMetricsResponse,
    EnergyDataCreate,
    PredictionForecastResponse,
    PredictionResponse,
)
from app.energy.services import energy_service, file_parser, prediction_service


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


router = APIRouter(prefix="/api/energy", tags=["Energy"])


# Endpoint para gráficos comunitarios globales
@router.get("/chart/global", response_model=list)
def get_global_chart_data(
    days: int = Query(7, ge=1, le=90, description="Número de días para mostrar"),
    db: Session = Depends(get_db),
):
    """Obtiene datos agregados para gráfica de producción vs consumo de la comunidad."""
    chart_data = energy_service.get_global_chart_data(db, days)
    return chart_data


# Endpoint para métricas globales de la comunidad
@router.get("/metrics/global", response_model=dict)
def get_global_metrics(
    days: int = Query(
        7, ge=1, le=90, description="Número de días para calcular métricas"
    ),
    db: Session = Depends(get_db),
):
    """Obtiene métricas agregadas de toda la comunidad (promedios y totales)."""
    metrics = energy_service.get_global_metrics(db, days)
    return metrics


@router.get("/metrics/today", response_model=DailyMetricsResponse)
def get_today_metrics(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Obtiene los totales de energía del día actual"""
    metrics = energy_service.get_daily_metrics(db, current_user.id)
    metrics["user_role"] = current_user.primary_role.value
    return DailyMetricsResponse(**metrics)


@router.get("/metrics/date", response_model=DailyMetricsResponse)
def get_date_metrics(
    target_date: date = Query(..., description="Fecha en formato YYYY-MM-DD"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Obtiene los totales de energía para una fecha específica"""
    metrics = energy_service.get_daily_metrics(db, current_user.id, target_date)
    metrics["user_role"] = current_user.primary_role.value
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
        energy_source_type=current_user.energy_source_type.value
        if current_user.energy_source_type
        else None,
    )


@router.post("/record")
def create_energy_record(
    energy_data: EnergyDataCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Crea un nuevo registro de energía"""
    return energy_service.create_energy_data(db, current_user.id, energy_data)


@router.post("/import")
async def import_energy_data(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Importa registros de energía desde un archivo CSV, XLSX, JSON o TXT."""
    filename = (file.filename or "").lower()
    raw = await file.read()

    try:
        if filename.endswith(".xlsx"):
            records = file_parser.parse_xlsx_content(raw)
        elif filename.endswith(".json"):
            records = file_parser.parse_json_content(raw.decode("utf-8"))
        elif filename.endswith(".csv") or filename.endswith(".txt"):
            records = file_parser.parse_csv_txt(raw.decode("utf-8"))
        else:
            raise HTTPException(
                status_code=400,
                detail="Formato no soportado. Use CSV, XLSX, JSON o TXT.",
            )
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(
            status_code=422,
            detail=f"Error al procesar el archivo: {exc}",
        ) from exc

    if not records:
        raise HTTPException(
            status_code=422,
            detail="No se encontraron datos válidos en el archivo. Verifique que las columnas de fecha, producción y consumo sean reconocibles.",
        )

    count = energy_service.upsert_energy_data(db, current_user.id, records)
    return {"message": f"Se importaron {count} registros exitosamente.", "count": count}


# Endpoints para predicciones
@router.get("/predictions/forecast", response_model=list[PredictionResponse])
def get_predictions_forecast(
    days: int = Query(
        7,
        ge=1,
        le=30,
        description="Número de días a predecir (default: 7)",
    ),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Obtiene predicciones de consumo y producción para los próximos días.
    Las predicciones se basan en el histórico de datos del usuario.
    """
    try:
        predictions = prediction_service.get_predictions(db, current_user.id, days)
        return predictions
    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail=f"Error al generar predicciones: {str(exc)}",
        ) from exc


@router.get("/predictions/detailed", response_model=PredictionForecastResponse)
def get_detailed_forecast(
    forecast_days: int = Query(
        7,
        ge=1,
        le=30,
        description="Número de días a predecir (default: 7)",
    ),
    historical_days: int = Query(
        7,
        ge=1,
        le=90,
        description="Número de días históricos a mostrar (default: 7)",
    ),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Obtiene un pronóstico completo que incluye:
    - Datos históricos reales de los últimos N días
    - Predicciones para los próximos N días
    - Métricas comparativas entre período histórico y predicho
    
    Útil para visualizar la diferencia entre datos reales y predichos.
    """
    try:
        forecast = prediction_service.get_forecast_with_historical(
            db, current_user.id, historical_days, forecast_days
        )
        return PredictionForecastResponse(**forecast)
    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail=f"Error al generar pronóstico: {str(exc)}",
        ) from exc
