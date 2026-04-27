from datetime import date, datetime, timedelta

from sqlalchemy import func
from sqlalchemy.orm import Session

from app.energy.models import EnergyData
from app.energy.schemas import EnergyDataCreate


def get_global_chart_data(db: Session, days: int = 7):
    """Obtiene datos agregados de producción vs consumo para la comunidad en los últimos N días."""
    from datetime import date, datetime, timedelta

    start_date = datetime.combine(
        date.today() - timedelta(days=days - 1), datetime.min.time()
    )
    end_date = datetime.combine(date.today(), datetime.max.time())

    # Importar User aquí para evitar dependencias circulares
    from app.auth.models.user import User

    active_user_ids = [
        u.id for u in db.query(User).filter(User.is_active).all()
    ]
    # Obtener todos los registros en el rango y solo de usuarios activos
    energy_records = (
        db.query(EnergyData)
        .filter(
            EnergyData.timestamp >= start_date,
            EnergyData.timestamp <= end_date,
            EnergyData.user_id.in_(active_user_ids),
        )
        .order_by(EnergyData.timestamp)
        .all()
    )

    # Crear un diccionario con todos los días, con datos 0 por defecto
    all_dates = {}
    current = start_date
    while current <= end_date:
        all_dates[current.date()] = {"produced": 0.0, "consumed": 0.0, "count": 0}
        current += timedelta(days=1)

    # Llenar con datos reales (sumar por día)
    for record in energy_records:
        d = record.timestamp.date()
        all_dates[d]["produced"] += record.energy_produced_kwh
        all_dates[d]["consumed"] += record.energy_consumed_kwh
        all_dates[d]["count"] += 1

    # Convertir a formato de respuesta
    chart_data = [
        {
            "timestamp": day.strftime("%Y-%m-%d"),
            "produced": data["produced"],
            "consumed": data["consumed"],
            "count": data["count"],
        }
        for day, data in all_dates.items()
    ]

    return chart_data


def get_global_metrics(db: Session, days: int = 7):
    """Obtiene métricas agregadas de toda la comunidad (promedios y totales) para los últimos N días."""
    from datetime import date, datetime, timedelta

    start_date = datetime.combine(
        date.today() - timedelta(days=days - 1), datetime.min.time()
    )
    end_date = datetime.combine(date.today(), datetime.max.time())

    # Importar User aquí para evitar dependencias circulares
    from app.auth.models.user import User

    # Obtener IDs de usuarios activos
    active_user_ids = [
        u.id for u in db.query(User).filter(User.is_active).all()
    ]
    # Filtrar por el rango de días y solo usuarios activos
    energy_records = (
        db.query(EnergyData)
        .filter(
            EnergyData.timestamp >= start_date,
            EnergyData.timestamp <= end_date,
            EnergyData.user_id.in_(active_user_ids),
        )
        .all()
    )

    total_produced = sum(r.energy_produced_kwh for r in energy_records)
    total_consumed = sum(r.energy_consumed_kwh for r in energy_records)
    net_balance = total_produced - total_consumed

    # Promedios
    if energy_records:
        avg_produced = total_produced / len(energy_records)
        avg_consumed = total_consumed / len(energy_records)
    else:
        avg_produced = 0.0
        avg_consumed = 0.0
    avg_net_balance = avg_produced - avg_consumed

    return {
        "total_produced_kwh": total_produced,
        "total_consumed_kwh": total_consumed,
        "net_balance_kwh": net_balance,
        "avg_produced_kwh": avg_produced,
        "avg_consumed_kwh": avg_consumed,
        "avg_net_balance_kwh": avg_net_balance,
    }


def create_energy_data(db: Session, user_id: int, energy_data: EnergyDataCreate):
    db_energy = EnergyData(
        user_id=user_id,
        timestamp=energy_data.timestamp,
        energy_produced_kwh=energy_data.energy_produced_kwh,
        energy_consumed_kwh=energy_data.energy_consumed_kwh,
    )
    db.add(db_energy)
    db.commit()
    db.refresh(db_energy)
    return db_energy


def upsert_energy_data(db: Session, user_id: int, records: list[dict]) -> int:
    """Insert or update energy records from an imported file.

    Each record must have keys: date (datetime.date), produced (float), consumed (float).
    Returns the number of records processed.
    """
    count = 0
    for record in records:
        target_date = record["date"]
        existing = (
            db.query(EnergyData)
            .filter(
                EnergyData.user_id == user_id,
                func.date(EnergyData.timestamp) == target_date,
            )
            .first()
        )
        if existing:
            existing.energy_produced_kwh = record["produced"]
            existing.energy_consumed_kwh = record["consumed"]
        else:
            db.add(
                EnergyData(
                    user_id=user_id,
                    timestamp=datetime(
                        target_date.year, target_date.month, target_date.day
                    ),
                    energy_produced_kwh=record["produced"],
                    energy_consumed_kwh=record["consumed"],
                )
            )
        count += 1
    db.commit()
    return count


def get_daily_metrics(db: Session, user_id: int, target_date: date = None):
    """Obtiene los totales de energía para un día específico (hoy por defecto)"""
    if target_date is None:
        target_date = date.today()

    energy_data = (
        db.query(EnergyData)
        .filter(
            EnergyData.user_id == user_id,
            func.date(EnergyData.timestamp) == target_date,
        )
        .first()
    )

    if not energy_data:
        return {
            "total_produced_kwh": 0.0,
            "total_consumed_kwh": 0.0,
            "net_balance_kwh": 0.0,
        }

    net_balance = energy_data.energy_produced_kwh - energy_data.energy_consumed_kwh

    return {
        "total_produced_kwh": energy_data.energy_produced_kwh,
        "total_consumed_kwh": energy_data.energy_consumed_kwh,
        "net_balance_kwh": net_balance,
    }


def get_chart_data(db: Session, user_id: int, days: int = 7):
    """Obtiene datos de producción vs consumo para los últimos N días"""
    start_date = datetime.combine(
        date.today() - timedelta(days=days - 1), datetime.min.time()
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

    # Crear un diccionario con todos los días, con datos 0 por defecto
    all_dates = {}
    current = start_date
    while current <= end_date:
        all_dates[current.date()] = {"produced": 0.0, "consumed": 0.0}
        current += timedelta(days=1)

    # Llenar con datos reales (sumar por día si hay múltiples registros)
    for record in energy_records:
        d = record.timestamp.date()
        all_dates[d]["produced"] += record.energy_produced_kwh
        all_dates[d]["consumed"] += record.energy_consumed_kwh

    # Convertir a formato de respuesta
    chart_data = [
        {
            "timestamp": day.strftime("%Y-%m-%d"),
            "produced": data["produced"],
            "consumed": data["consumed"],
        }
        for day, data in all_dates.items()
    ]

    return chart_data
