import logging

from fastapi_mail import ConnectionConfig, FastMail, MessageSchema

from app.core import config


logger = logging.getLogger(__name__)

_is_configured = bool(config.MAIL_USER and config.MAIL_HOST)

if _is_configured:
    _mail_config = ConnectionConfig(
        MAIL_USERNAME=config.MAIL_USER,
        MAIL_PASSWORD=config.MAIL_PASS,
        MAIL_FROM=config.MAIL_FROM,
        MAIL_PORT=config.MAIL_PORT,
        MAIL_SERVER=config.MAIL_HOST,
        MAIL_FROM_NAME=config.MAIL_FROM_NAME,
        MAIL_STARTTLS=config.MAIL_TLS,
        MAIL_SSL_TLS=config.MAIL_SSL,
        USE_CREDENTIALS=True,
        VALIDATE_CERTS=True,
    )
    _fm = FastMail(_mail_config)
else:
    _fm = None
    logger.warning(
        "Email configuracion SMTP no encontrada (MAIL_USER / MAIL_HOST). "
        "Los correos de alerta no se enviaran."
    )


async def send_alert_email(
    recipient_email: str,
    alert_type: str,
    message: str,
    threshold_kwh: float,
    current_value_kwh: float,
) -> None:
    if not _fm:
        logger.info(
            "Email no configurado. Alerta no enviada por correo a %s: %s",
            recipient_email,
            alert_type,
        )
        return

    try:
        body = (
            f"Se ha activado una alerta en EnergyHub\n\n"
            f"Tipo: {alert_type}\n"
            f"Mensaje: {message}\n"
            f"Umbral: {threshold_kwh:.2f} kWh\n"
            f"Valor actual: {current_value_kwh:.2f} kWh\n\n"
            f"Atentamente,\nEnergyHub"
        )

        msg = MessageSchema(
            subject=f"EnergyHub - Alerta: {alert_type}",
            recipients=[recipient_email],
            body=body,
            subtype="plain",
        )

        await _fm.send_message(msg)
        logger.info("Correo de alerta enviado a %s: %s", recipient_email, alert_type)
    except Exception as e:
        logger.error("Error al enviar correo de alerta a %s: %s", recipient_email, e)
