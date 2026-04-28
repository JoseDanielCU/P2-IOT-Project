from sqlalchemy.orm import Session

from app.alerts.models.alert_config import AlertConfiguration, AlertType
from app.alerts.schemas.alert_schema import AlertConfigCreate, TriggeredAlert


def get_user_alert_configs(db: Session, user_id: int) -> list[AlertConfiguration]:
    """Devuelve todas las configuraciones de alerta del usuario."""
    return (
        db.query(AlertConfiguration)
        .filter(AlertConfiguration.user_id == user_id)
        .order_by(AlertConfiguration.alert_type)
        .all()
    )


def upsert_alert_configs(
    db: Session, user_id: int, configs: list[AlertConfigCreate]
) -> list[AlertConfiguration]:
    """Crea o actualiza las configuraciones de alerta del usuario.

    Si ya existe una configuración para ese tipo de alerta, la actualiza;
    si no existe, la crea. Devuelve la lista de configuraciones resultante.
    """
    existing_by_type: dict[AlertType, AlertConfiguration] = {
        cfg.alert_type: cfg
        for cfg in db.query(AlertConfiguration)
        .filter(AlertConfiguration.user_id == user_id)
        .all()
    }

    for config_in in configs:
        if config_in.alert_type in existing_by_type:
            record = existing_by_type[config_in.alert_type]
            record.threshold_kwh = config_in.threshold_kwh
            record.is_enabled = config_in.is_enabled
        else:
            record = AlertConfiguration(
                user_id=user_id,
                alert_type=config_in.alert_type,
                threshold_kwh=config_in.threshold_kwh,
                is_enabled=config_in.is_enabled,
            )
            db.add(record)

    db.commit()
    return get_user_alert_configs(db, user_id)


def check_alerts(db: Session, user_id: int, metrics: dict) -> list[TriggeredAlert]:
    """Compara las métricas energéticas del día con los umbrales configurados.

    Devuelve la lista de alertas que superan (o no alcanzan) sus umbrales.
    """
    configs = (
        db.query(AlertConfiguration)
        .filter(
            AlertConfiguration.user_id == user_id,
            AlertConfiguration.is_enabled == True,  # noqa: E712
        )
        .all()
    )

    produced = metrics.get("total_produced_kwh", 0.0)
    consumed = metrics.get("total_consumed_kwh", 0.0)
    balance = metrics.get("net_balance_kwh", 0.0)

    triggered: list[TriggeredAlert] = []

    for cfg in configs:
        alert: TriggeredAlert | None = None

        if cfg.alert_type == AlertType.production_high and produced > cfg.threshold_kwh:
            alert = TriggeredAlert(
                alert_type=cfg.alert_type,
                threshold_kwh=cfg.threshold_kwh,
                current_value_kwh=produced,
                message=(
                    f"Producción ({produced:.2f} kWh) supera el umbral de "
                    f"{cfg.threshold_kwh:.2f} kWh."
                ),
            )
        elif (
            cfg.alert_type == AlertType.production_low and produced < cfg.threshold_kwh
        ):
            alert = TriggeredAlert(
                alert_type=cfg.alert_type,
                threshold_kwh=cfg.threshold_kwh,
                current_value_kwh=produced,
                message=(
                    f"Producción ({produced:.2f} kWh) está por debajo del umbral de "
                    f"{cfg.threshold_kwh:.2f} kWh."
                ),
            )
        elif (
            cfg.alert_type == AlertType.consumption_high
            and consumed > cfg.threshold_kwh
        ):
            alert = TriggeredAlert(
                alert_type=cfg.alert_type,
                threshold_kwh=cfg.threshold_kwh,
                current_value_kwh=consumed,
                message=(
                    f"Consumo ({consumed:.2f} kWh) supera el umbral de "
                    f"{cfg.threshold_kwh:.2f} kWh."
                ),
            )
        elif (
            cfg.alert_type == AlertType.consumption_low and consumed < cfg.threshold_kwh
        ):
            alert = TriggeredAlert(
                alert_type=cfg.alert_type,
                threshold_kwh=cfg.threshold_kwh,
                current_value_kwh=consumed,
                message=(
                    f"Consumo ({consumed:.2f} kWh) está por debajo del umbral de "
                    f"{cfg.threshold_kwh:.2f} kWh."
                ),
            )
        elif cfg.alert_type == AlertType.balance_low and balance < cfg.threshold_kwh:
            alert = TriggeredAlert(
                alert_type=cfg.alert_type,
                threshold_kwh=cfg.threshold_kwh,
                current_value_kwh=balance,
                message=(
                    f"Balance neto ({balance:.2f} kWh) está por debajo del umbral de "
                    f"{cfg.threshold_kwh:.2f} kWh."
                ),
            )

        if alert:
            triggered.append(alert)

    return triggered
