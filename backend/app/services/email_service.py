"""Email sending service."""

import logging
import aiosmtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from app.config import settings

logger = logging.getLogger(__name__)


async def send_password_reset_email(to_email: str, reset_token: str) -> None:
    """Send a password reset email with the reset link."""
    if not settings.smtp_username:
        logger.warning(
            "SMTP not configured — password reset token for %s: %s",
            to_email,
            reset_token,
        )
        return

    reset_url = f"{settings.app_base_url}/reset-password?token={reset_token}"

    message = MIMEMultipart("alternative")
    message["Subject"] = "Reset your HighlightEdit password"
    message["From"] = settings.smtp_from_email
    message["To"] = to_email

    text_body = f"Click the link to reset your password: {reset_url}\n\nThis link expires in 15 minutes."
    html_body = f"""
    <p>Click the button below to reset your password:</p>
    <p><a href="{reset_url}" style="background:#2563eb;color:#fff;padding:10px 20px;border-radius:4px;text-decoration:none;">Reset Password</a></p>
    <p>This link expires in 15 minutes. If you didn't request this, ignore this email.</p>
    """

    message.attach(MIMEText(text_body, "plain"))
    message.attach(MIMEText(html_body, "html"))

    try:
        await aiosmtplib.send(
            message,
            hostname=settings.smtp_host,
            port=settings.smtp_port,
            username=settings.smtp_username,
            password=settings.smtp_password,
            start_tls=True,
        )
        logger.info("Password reset email sent to %s", to_email)
    except Exception as exc:
        logger.error("Failed to send password reset email to %s: %s", to_email, exc)
        raise
