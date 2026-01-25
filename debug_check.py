import sys
import os
import logging

# Add backend to path
sys.path.append(os.path.join(os.getcwd(), 'backend'))

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("debug_check")

try:
    from app.config import settings
    logger.info("Successfully loaded settings.")
    logger.info(f"ADOBE_CLIENT_ID set: {bool(settings.adobe_client_id)}")
    logger.info(f"ADOBE_CLIENT_SECRET set: {bool(settings.adobe_client_secret)}")
except Exception as e:
    logger.error(f"Failed to load settings: {e}")
    sys.exit(1)

try:
    from adobe.pdfservices.operation.auth.service_principal_credentials import ServicePrincipalCredentials
    logger.info("Adobe SDK imported successfully.")
except ImportError:
    logger.error("Failed to import Adobe SDK.")
    sys.exit(1)

try:
    if settings.adobe_client_id and settings.adobe_client_secret:
        credentials = ServicePrincipalCredentials.Builder() \
            .with_client_id(settings.adobe_client_id) \
            .with_client_secret(settings.adobe_client_secret) \
            .build()
        logger.info("Successfully built Adobe credentials validation object.")
    else:
        logger.warning("Adobe credentials are empty.")
except Exception as e:
    logger.error(f"Failed to build credentials: {e}")
