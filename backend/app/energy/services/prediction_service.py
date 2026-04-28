"""
Servicio de predicción de consumo energético.
Utiliza la API de OpenAI (GPT) para generar predicciones inteligentes.
"""

import json
import os
from datetime import date, datetime, timedelta

from openai import OpenAI
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.core.config import OPENAI_API_KEY
from app.energy.models import EnergyData, EnergyPrediction


# Cliente de OpenAI — toma la clave del entorno
_openai_client = OpenAI(api_key=OPENAI_API_KEY)


def get_historical_daily_values(
    db: Session, user_id: int, energy_type: str = "consumed", days: int = 30
) -> list[float]:
    """
    Obtiene los valores históricos diarios de consumo o producción.
    """
    start_date = datetime.combine(
        date.today() - timedelta(days=days), datetime.min.time()
    )
    end_date = datetime.combine(date.today(), datetime.max.time())

    energy_records = (
        db.query(EnergyData)
        .filter(
            EnergyData.user_id == user_id,
            EnergyData.timestamp >= start_date,
            EnergyData.timestamp <= end_date,
        )
        .order_by(EnergyData.timestamp)
        .all()
    )

    daily_values: dict[date, dict[str, float]] = {}
    for record in energy_records:
        day = record.timestamp.date()
        if day not in daily_values:
            daily_values[day] = {"consumed": 0.0, "produced": 0.0}
        daily_values[day]["consumed"] += record.energy_consumed_kwh
        daily_values[day]["produced"] += record.energy_produced_kwh

    return [daily_values[day][energy_type] for day in sorted(daily_values.keys())]


def _build_historical_summary(
    db: Session, user_id: int, historical_days: int
) -> list[dict]:
    """
    Devuelve una lista de dicts {date, consumed_kwh, produced_kwh}
    ordenados cronológicamente para pasarle al modelo.
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


# ---------------------------------------------------------------------------
# Predicción con OpenAI
# ---------------------------------------------------------------------------

def _call_openai_for_predictions(
    historical_data: list[dict],
    forecast_days: int,
) -> list[dict]:
    """
    Llama a la API de OpenAI para generar predicciones de consumo/producción.

    Devuelve una lista de dicts con las claves:
        date, predicted_consumed_kwh, predicted_produced_kwh
    """
    today = date.today()
    forecast_dates = [
        str(today + timedelta(days=i)) for i in range(1, forecast_days + 1)
    ]
    # print("=== OPENAI API KEY ===", os.environ.get("OPENAI_API_KEY", "NO ENCONTRADA")[:10])
    # ... resto de la función
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
        model="gpt-4o-mini",          # Puedes cambiar a gpt-4o si necesitas mayor precisión
        temperature=0.2,              # Baja temperatura → respuestas más deterministas
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
        result.append({
            "date": item["date"],
            "predicted_consumed_kwh": max(0.0, float(item["predicted_consumed_kwh"])),
            "predicted_produced_kwh": max(0.0, float(item["predicted_produced_kwh"])),
        })

    # print("=== OPENAI RAW RESPONSE ===", raw)
    # print("=== OPENAI PARSED ITEMS ===", items)
    return result


def generate_predictions(
    db: Session,
    user_id: int,
    forecast_days: int = 7,
    historical_days: int = 30,
) -> list[dict]:
    """
    Genera predicciones de consumo y producción usando OpenAI.

    Returns:
        Lista de dicts con claves:
            prediction_date (datetime),
            predicted_consumption_kwh (float),
            predicted_production_kwh (float)
    """
    historical_data = _build_historical_summary(db, user_id, historical_days)

    if not historical_data:
        # Sin historial: devolver ceros para que el pipeline no falle
        today = date.today()
        return [
            {
                "prediction_date": datetime.combine(
                    today + timedelta(days=i), datetime.min.time()
                ),
                "predicted_consumption_kwh": 0.0,
                "predicted_production_kwh": 0.0,
            }
            for i in range(1, forecast_days + 1)
        ]

    openai_predictions = _call_openai_for_predictions(historical_data, forecast_days)

    # Convertir al formato interno que espera save_predictions / get_predictions
    return [
        {
            "prediction_date": datetime.combine(
                date.fromisoformat(p["date"]), datetime.min.time()
            ),
            "predicted_consumption_kwh": p["predicted_consumed_kwh"],
            "predicted_production_kwh": p["predicted_produced_kwh"],
        }
        for p in openai_predictions
    ]

def save_predictions(
    db: Session,
    user_id: int,
    predictions: list[dict],
    model_version: str = "openai-gpt-4o-mini",
) -> int:
    """Guarda (o actualiza) las predicciones en la base de datos."""
    count = 0

    for pred in predictions:
        existing = (
            db.query(EnergyPrediction)
            .filter(
                EnergyPrediction.user_id == user_id,
                func.date(EnergyPrediction.prediction_date)
                == pred["prediction_date"].date(),
            )
            .first()
        )

        if existing:
            existing.predicted_consumption_kwh = pred["predicted_consumption_kwh"]
            existing.predicted_production_kwh = pred["predicted_production_kwh"]
            existing.model_version = model_version
        else:
            db.add(
                EnergyPrediction(
                    user_id=user_id,
                    prediction_date=pred["prediction_date"],
                    predicted_consumption_kwh=pred["predicted_consumption_kwh"],
                    predicted_production_kwh=pred["predicted_production_kwh"],
                    model_version=model_version,
                )
            )
        count += 1

    db.commit()
    return count


def get_predictions(
    db: Session, user_id: int, forecast_days: int = 7
) -> list[EnergyPrediction]:
    today = date.today()
    start_date = datetime.combine(today, datetime.min.time())
    end_date = datetime.combine(
        today + timedelta(days=forecast_days), datetime.max.time()
    )

    existing = (
        db.query(EnergyPrediction)
        .filter(
            EnergyPrediction.user_id == user_id,
            EnergyPrediction.prediction_date >= start_date,
            EnergyPrediction.prediction_date <= end_date,
        )
        .order_by(EnergyPrediction.prediction_date)
        .all()
    )

    all_zero = all(
        p.predicted_consumption_kwh == 0.0 and p.predicted_production_kwh == 0.0
        for p in existing
    )

    if len(existing) >= forecast_days and not all_zero:
        return existing[:forecast_days]

    # Borrar las predicciones en 0 antes de regenerar
    if existing:
        for p in existing:
            db.delete(p)
        db.commit()

    new_preds = generate_predictions(db, user_id, forecast_days, historical_days=30)
    save_predictions(db, user_id, new_preds)

    return (
        db.query(EnergyPrediction)
        .filter(
            EnergyPrediction.user_id == user_id,
            EnergyPrediction.prediction_date >= start_date,
            EnergyPrediction.prediction_date <= end_date,
        )
        .order_by(EnergyPrediction.prediction_date)
        .all()
    )

def get_forecast_with_historical(
    db: Session,
    user_id: int,
    historical_days: int = 7,
    forecast_days: int = 7,
) -> dict:
    """Devuelve un pronóstico completo que incluye datos históricos agrupados por día y predicciones futuras."""
    start_date = datetime.combine(
        date.today() - timedelta(days=historical_days - 1), datetime.min.time()
    )
    end_date = datetime.combine(date.today(), datetime.max.time())

    historical_records = (
        db.query(EnergyData)
        .filter(
            EnergyData.user_id == user_id,
            EnergyData.timestamp >= start_date,
            EnergyData.timestamp <= end_date,
        )
        .order_by(EnergyData.timestamp)
        .all()
    )

    # ✅ Agrupar por día (igual que las predicciones)
    daily: dict[date, dict[str, float]] = {}
    for r in historical_records:
        day = r.timestamp.date()
        if day not in daily:
            daily[day] = {"consumed": 0.0, "produced": 0.0}
        daily[day]["consumed"] += r.energy_consumed_kwh
        daily[day]["produced"] += r.energy_produced_kwh

    historical_data = [
        {
            "timestamp": str(day),
            "produced": round(daily[day]["produced"], 4),
            "consumed": round(daily[day]["consumed"], 4),
        }
        for day in sorted(daily.keys())
    ]

    predictions_db = get_predictions(db, user_id, forecast_days)
    predictions = [
        {
            "timestamp": p.prediction_date.strftime("%Y-%m-%d"),
            "predicted_consumed": p.predicted_consumption_kwh,
            "predicted_produced": p.predicted_production_kwh,
            "is_prediction": True,
        }
        for p in predictions_db
    ]

    total_produced = sum(r.energy_produced_kwh for r in historical_records)
    total_consumed = sum(r.energy_consumed_kwh for r in historical_records)
    predicted_total_consumed = sum(p["predicted_consumed"] for p in predictions)
    predicted_total_produced = sum(p["predicted_produced"] for p in predictions)

    metrics = {
        "historical_period_days": historical_days,
        "historical_total_produced_kwh": total_produced,
        "historical_total_consumed_kwh": total_consumed,
        "historical_net_balance_kwh": total_produced - total_consumed,
        "forecast_period_days": forecast_days,
        "predicted_total_produced_kwh": predicted_total_produced,
        "predicted_total_consumed_kwh": predicted_total_consumed,
        "predicted_net_balance_kwh": predicted_total_produced - predicted_total_consumed,
    }

    # print("=== HISTORICAL DATA ===", historical_data)
    # print("=== PREDICTIONS ===", predictions)
    # print("=== METRICS ===", metrics)
    return {
        "historical_data": historical_data,
        "predictions": predictions,
        "metrics": metrics,
        "forecast_period_days": forecast_days,
        "generation_date": datetime.now(),
    }