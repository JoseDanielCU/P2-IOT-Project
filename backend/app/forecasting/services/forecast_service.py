"""
Servicio de forecasting energético (HU-IA-05).

Implementa regresión lineal simple en Python puro (sin dependencias externas)
para proyectar producción y consumo energético hacia adelante.
"""

from datetime import date, timedelta

from sqlalchemy.orm import Session

from app.energy.models import EnergyData

HISTORY_WINDOW_DAYS = 90


def _linear_regression(values: list[float]) -> tuple[float, float]:
    """Calcula pendiente e intercepto de una regresión lineal sobre una serie.

    Retorna (slope, intercept) donde la predicción para el índice i es:
        intercept + slope * i
    """
    n = len(values)
    if n == 0:
        return 0.0, 0.0
    if n == 1:
        return 0.0, values[0]

    sum_x = n * (n - 1) / 2
    sum_x2 = n * (n - 1) * (2 * n - 1) / 6
    sum_y = sum(values)
    sum_xy = sum(i * v for i, v in enumerate(values))

    denominator = n * sum_x2 - sum_x ** 2
    if denominator == 0:
        return 0.0, sum_y / n

    slope = (n * sum_xy - sum_x * sum_y) / denominator
    intercept = (sum_y - slope * sum_x) / n
    return slope, intercept


def get_forecast(db: Session, user_id: int, horizon_days: int) -> list[dict]:
    """Genera la predicción de producción y consumo para los próximos N días.

    Algoritmo:
        1. Recupera hasta HISTORY_WINDOW_DAYS días de datos históricos.
        2. Ajusta una regresión lineal para producción y consumo.
        3. Proyecta los valores para cada día del horizonte solicitado.
        4. Asegura que los valores predichos no sean negativos.
    """
    start_history = date.today() - timedelta(days=HISTORY_WINDOW_DAYS)

    records = (
        db.query(EnergyData)
        .filter(
            EnergyData.user_id == user_id,
            EnergyData.timestamp >= start_history,
        )
        .order_by(EnergyData.timestamp.asc())
        .all()
    )

    produced_series = [r.energy_produced_kwh for r in records]
    consumed_series = [r.energy_consumed_kwh for r in records]

    prod_slope, prod_intercept = _linear_regression(produced_series)
    cons_slope, cons_intercept = _linear_regression(consumed_series)

    base_index = len(produced_series)

    forecast_results = []
    for day_offset in range(1, horizon_days + 1):
        future_date = date.today() + timedelta(days=day_offset)
        index = base_index + day_offset - 1

        predicted_produced = max(0.0, prod_intercept + prod_slope * index)
        predicted_consumed = max(0.0, cons_intercept + cons_slope * index)

        forecast_results.append(
            {
                "date": future_date.strftime("%Y-%m-%d"),
                "predicted_produced_kwh": round(predicted_produced, 3),
                "predicted_consumed_kwh": round(predicted_consumed, 3),
            }
        )

    return forecast_results
