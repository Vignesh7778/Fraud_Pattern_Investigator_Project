import logging
import sys

try:
    import structlog
    HAS_STRUCTLOG = True
except ImportError:
    HAS_STRUCTLOG = False

from app.core.config import settings


def setup_logging():
    log_level = getattr(logging, settings.LOG_LEVEL.upper(), logging.INFO)

    logging.basicConfig(
        format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
        stream=sys.stdout,
        level=log_level,
    )

    if HAS_STRUCTLOG:
        structlog.configure(
            processors=[
                structlog.contextvars.merge_contextvars,
                structlog.processors.add_log_level,
                structlog.processors.StackInfoRenderer(),
                structlog.dev.set_exc_info,
                structlog.processors.TimeStamper(fmt="iso"),
                structlog.processors.JSONRenderer() if settings.ENVIRONMENT == "production" else structlog.dev.ConsoleRenderer()
            ],
            wrapper_class=structlog.make_filtering_bound_logger(log_level),
            context_class=dict,
            logger_factory=structlog.PrintLoggerFactory(),
            cache_logger_on_first_use=True,
        )


class FallbackLogger:
    def __init__(self):
        self._logger = logging.getLogger("fraud_investigator")

    def info(self, event, **kwargs):
        self._logger.info(f"{event} {kwargs if kwargs else ''}")

    def error(self, event, **kwargs):
        self._logger.error(f"{event} {kwargs if kwargs else ''}")

    def warning(self, event, **kwargs):
        self._logger.warning(f"{event} {kwargs if kwargs else ''}")


logger = structlog.get_logger() if HAS_STRUCTLOG else FallbackLogger()

