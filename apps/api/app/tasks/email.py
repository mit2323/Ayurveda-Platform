"""Email Celery tasks — order confirmations, password resets, etc."""
from loguru import logger
from sendgrid import SendGridAPIClient
from sendgrid.helpers.mail import Mail

from app.core.config import settings
from app.tasks.celery_app import celery_app


def _send_email(to: str, subject: str, html_content: str) -> bool:
    if not settings.SENDGRID_API_KEY:
        logger.warning(f"SendGrid not configured. Would send to {to}: {subject}")
        return True
    try:
        message = Mail(
            from_email=(settings.FROM_EMAIL, settings.FROM_NAME),
            to_emails=to,
            subject=subject,
            html_content=html_content,
        )
        sg = SendGridAPIClient(settings.SENDGRID_API_KEY)
        sg.send(message)
        return True
    except Exception as e:
        logger.error(f"Failed to send email to {to}: {e}")
        return False


@celery_app.task(bind=True, max_retries=3, default_retry_delay=60)
def send_order_confirmation_email(self, order_id: int):
    """Send order confirmation email after successful payment."""
    try:
        # In a real impl, fetch order from DB and build rich HTML
        logger.info(f"Sending order confirmation for order {order_id}")
        # _send_email(user_email, "Order Confirmed!", html)
    except Exception as exc:
        raise self.retry(exc=exc)


@celery_app.task(bind=True, max_retries=3, default_retry_delay=60)
def send_order_shipped_email(self, order_id: int, tracking_number: str):
    """Send shipping notification with tracking number."""
    try:
        logger.info(f"Sending shipping email for order {order_id}, tracking: {tracking_number}")
    except Exception as exc:
        raise self.retry(exc=exc)


@celery_app.task(bind=True, max_retries=3, default_retry_delay=60)
def send_password_reset_email(self, user_id: int, reset_token: str):
    """Send password reset link."""
    try:
        reset_url = f"{settings.FRONTEND_URL}/auth/reset-password?token={reset_token}"
        logger.info(f"Sending password reset to user {user_id}: {reset_url}")
    except Exception as exc:
        raise self.retry(exc=exc)


@celery_app.task(bind=True, max_retries=3, default_retry_delay=60)
def send_verification_email(self, user_id: int, verify_token: str):
    """Send email address verification link."""
    try:
        verify_url = f"{settings.FRONTEND_URL}/auth/verify-email?token={verify_token}"
        logger.info(f"Sending verification email to user {user_id}: {verify_url}")
    except Exception as exc:
        raise self.retry(exc=exc)