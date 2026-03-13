from datetime import date, datetime, timedelta

from sqlalchemy import func
from sqlalchemy.orm import Session

from app.energy.models import EnergyData
from app.energy.schemas import EnergyDataCreate


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

    # Llenar con datos reales
    for record in energy_records:
        all_dates[record.timestamp.date()] = {
            "produced": record.energy_produced_kwh,
            "consumed": record.energy_consumed_kwh,
        }

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
