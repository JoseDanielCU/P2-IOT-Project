"""
Servicio de forecasting energético (HU-IA-05).

Implementa predicciones inteligentes usando OpenAI (GPT-4o-mini)
para proyectar producción y consumo energético hacia adelante.

Con fallback automático a regresión lineal si:
- OpenAI API key no está configurada
- Hay error de cuota/rate limit
- La API no responde
"""

import json
import logging
from datetime import date, datetime, timedelta

from openai import APIError, OpenAI, RateLimitError
from sqlalchemy.orm import Session

from app.core.config import OPENAI_API_KEY
from app.energy.models import EnergyData


logger = logging.getLogger(__name__)

# Cliente de OpenAI
_openai_client = OpenAI(api_key=OPENAI_API_KEY) if OPENAI_API_KEY else None

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

    denominator = n * sum_x2 - sum_x**2
    if denominator == 0:
        return 0.0, sum_y / n

    slope = (n * sum_xy - sum_x * sum_y) / denominator
    intercept = (sum_y - slope * sum_x) / n
    return slope, intercept


def _build_historical_summary(
    db: Session, user_id: int, historical_days: int
) -> list[dict]:
    """
    Devuelve una lista de dicts {date, consumed_kwh, produced_kwh}
    ordenados cronológicamente para pasarle al modelo de IA.
    """
    start_date = datetime.combine(
        date.today() - timedelta(days=historical_days), datetime.min.time()
    )
    end_date = datetime.combine(date.today(), datetime.max.time())

    records = (
        db.query(EnergyData)
        .filter(
            EnergyData.user_id == user_id,
            EnergyData.timestamp >= start_date,
            EnergyData.timestamp <= end_date,
        )
        .order_by(EnergyData.timestamp)
        .all()
    )

    daily: dict[date, dict[str, float]] = {}
    for r in records:
        day = r.timestamp.date()
        if day not in daily:
            daily[day] = {"consumed": 0.0, "produced": 0.0}
        daily[day]["consumed"] += r.energy_consumed_kwh
        daily[day]["produced"] += r.energy_produced_kwh

    return [
        {
            "date": str(day),
            "consumed_kwh": round(daily[day]["consumed"], 4),
            "produced_kwh": round(daily[day]["produced"], 4),
        }
        for day in sorted(daily.keys())
    ]


def _call_openai_for_predictions(
    historical_data: list[dict],
    forecast_days: int,
) -> list[dict] | None:
    """
    Llama a la API de OpenAI para generar predicciones de consumo/producción.

    Devuelve una lista de dicts con las claves:
        date, predicted_consumed_kwh, predicted_produced_kwh

    Retorna None si hay un error (para usar fallback a regresión lineal)
    """
    if not _openai_client:
        logger.warning(
            "OpenAI API key not configured, using linear regression fallback"
        )
        return None

    try:
        today = date.today()
        forecast_dates = [
            str(today + timedelta(days=i)) for i in range(1, forecast_days + 1)
        ]

        system_prompt = (
            "Eres un modelo experto en series temporales de energía eléctrica. "
            "Tu única tarea es predecir el consumo y la producción diaria de energía "
            "(en kWh) para los días indicados, basándote en el historial proporcionado. "
            "Considera patrones semanales (días laborales vs. fines de semana), "
            "tendencias recientes y cualquier anomalía visible en los datos. "
            "Responde ÚNICAMENTE con un array JSON válido, sin texto adicional, "
            "sin bloques de código markdown. Cada elemento del array debe tener "
            "exactamente estas claves: "
            '"date" (YYYY-MM-DD), '
            '"predicted_consumed_kwh" (número), '
            '"predicted_produced_kwh" (número).'
        )

        user_prompt = (
            f"Historial de los últimos {len(historical_data)} días:\n"
            f"{json.dumps(historical_data, ensure_ascii=False)}\n\n"
            f"Genera predicciones para las siguientes fechas: {forecast_dates}.\n"
            "Devuelve solo el array JSON."
        )

        response = _openai_client.chat.completions.create(
            model="gpt-4o-mini",
            temperature=0.2,
            response_format={"type": "json_object"},
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt},
            ],
        )

        raw = response.choices[0].message.content or "{}"
        parsed = json.loads(raw)

        # El modelo puede devolver {"predictions": [...]} o directamente [...]
        if isinstance(parsed, list):
            items = parsed
        else:
            # Buscar el primer valor que sea lista
            items = next(
                (v for v in parsed.values() if isinstance(v, list)),
                [],
            )

        # Normalizar y validar cada elemento
        result = []
        for item in items:
            result.append(
                {
                    "date": item["date"],
                    "predicted_consumed_kwh": max(
                        0.0, float(item["predicted_consumed_kwh"])
                    ),
                    "predicted_produced_kwh": max(
                        0.0, float(item["predicted_produced_kwh"])
                    ),
                }
            )

        return result

    except RateLimitError as e:
        logger.warning(
            f"OpenAI rate limit exceeded or quota exceeded: {str(e)}. "
            f"Using linear regression fallback."
        )
        return None
    except APIError as e:
        logger.warning(f"OpenAI API error: {str(e)}. Using linear regression fallback.")
        return None
    except Exception as e:
        logger.warning(
            f"Unexpected error calling OpenAI: {str(e)}. "
            f"Using linear regression fallback."
        )
        return None


def _fallback_linear_regression(
    produced_series: list[float],
    consumed_series: list[float],
    horizon_days: int,
) -> list[dict]:
    """Fallback: genera predicciones usando regresión lineal simple."""
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
                "predicted_consumed_kwh": round(predicted_consumed, 3),
                "predicted_produced_kwh": round(predicted_produced, 3),
            }
        )

    return forecast_results


def get_forecast(db: Session, user_id: int, horizon_days: int) -> list[dict]:
    """Genera la predicción de producción y consumo para los próximos N días.

    Algoritmo con fallback:
        1. Intenta usar OpenAI GPT-4o-mini para predicciones inteligentes
        2. Si OpenAI falla (sin cuota, sin key, etc), usa regresión lineal como fallback
        3. Recupera hasta HISTORY_WINDOW_DAYS días de datos históricos
        4. Proyecta los valores para cada día del horizonte solicitado

    Args:
        db: Sesión de base de datos
        user_id: ID del usuario
        horizon_days: Número de días a predecir (1-90)

    Returns:
        Lista de dicts con claves: date, predicted_produced_kwh, predicted_consumed_kwh
    """
    # Obtener datos históricos
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

    if not records:
        # Sin historial: devolver ceros para que el pipeline no falle
        today = date.today()
        return [
            {
                "date": (today + timedelta(days=i)).strftime("%Y-%m-%d"),
                "predicted_produced_kwh": 0.0,
                "predicted_consumed_kwh": 0.0,
            }
            for i in range(1, horizon_days + 1)
        ]

    # Intentar con OpenAI primero
    historical_data = _build_historical_summary(db, user_id, HISTORY_WINDOW_DAYS)
    openai_predictions = _call_openai_for_predictions(historical_data, horizon_days)

    if openai_predictions:
        logger.info(
            f"Successfully generated predictions using OpenAI for user {user_id}"
        )
        return openai_predictions[:horizon_days]

    # Fallback: regresión lineal
    produced_series = [r.energy_produced_kwh for r in records]
    consumed_series = [r.energy_consumed_kwh for r in records]

    logger.info(f"Using linear regression fallback for predictions (user {user_id})")
    return _fallback_linear_regression(produced_series, consumed_series, horizon_days)
