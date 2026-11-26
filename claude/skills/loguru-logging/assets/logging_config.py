"""
Production-grade Loguru setup — adapt to your project.

Drop this file in your package, then call `setup_logging(...)` ONCE at your
application entry point (e.g. inside `if __name__ == "__main__":` or your
app/server factory). Every other module just does `from loguru import logger`
and uses it directly — do not call setup_logging() more than once and never
wrap the logger.

It provides:
  - a human-readable, colored console sink (level driven by APP_LOG_LEVEL);
  - a structured JSON file sink with rotation/retention/compression;
  - interception of the standard `logging` module (so logs from dependencies
    such as FastAPI/Uvicorn/SQLAlchemy land in the same place);
  - an optional secret-masking hook (off by default — wire it to your fields);
  - diagnose disabled by default (variable values in tracebacks can leak
    secrets); enable it explicitly in development only.

Environment knobs:
  APP_LOG_LEVEL   console level         (default "INFO")
  APP_LOG_DIR     directory for files   (default "logs")
  APP_ENV         "dev" enables diagnose + DEBUG file level (default "prod")
"""

from __future__ import annotations

import inspect
import logging
import os
import re
import sys
from pathlib import Path

from loguru import logger

# --------------------------------------------------------------------------- #
# Optional masking — extend SENSITIVE_KEYS / patterns for your domain.
# --------------------------------------------------------------------------- #
SENSITIVE_KEYS = {"password", "token", "api_key", "apikey", "secret",
                  "authorization", "card", "cvv", "ssn"}
_CARD_RE = re.compile(r"\b(?:\d[ -]*?){13,16}\b")


def _mask(record) -> None:
    """Redact sensitive bound context and obvious card numbers in the message."""
    for key in list(record["extra"]):
        if key.lower() in SENSITIVE_KEYS:
            record["extra"][key] = "***REDACTED***"
    record["message"] = _CARD_RE.sub("***CARD***", record["message"])


# --------------------------------------------------------------------------- #
# Standard-library logging interception.
# --------------------------------------------------------------------------- #
class InterceptHandler(logging.Handler):
    """Forward stdlib logging records into Loguru with correct call context."""

    def emit(self, record: logging.LogRecord) -> None:
        try:
            level: str | int = logger.level(record.levelname).name
        except ValueError:
            level = record.levelno
        frame, depth = inspect.currentframe(), 0
        while frame:
            filename = frame.f_code.co_filename
            is_logging = filename == logging.__file__
            is_frozen = "importlib" in filename and "_bootstrap" in filename
            if depth > 0 and not (is_logging or is_frozen):
                break
            frame = frame.f_back
            depth += 1
        logger.opt(depth=depth, exception=record.exc_info).log(level, record.getMessage())


# --------------------------------------------------------------------------- #
# Main entry point.
# --------------------------------------------------------------------------- #
CONSOLE_FORMAT = (
    "<green>{time:YYYY-MM-DD HH:mm:ss.SSS}</green> | "
    "<level>{level: <8}</level> | "
    "<cyan>{name}</cyan>:<cyan>{function}</cyan>:<cyan>{line}</cyan> | "
    "{extra} - <level>{message}</level>"
)


def setup_logging(
    *,
    console_level: str | None = None,
    log_dir: str | None = None,
    enable_masking: bool = True,
    intercept_stdlib: bool = True,
) -> None:
    """Configure Loguru. Call exactly once, at the application entry point."""
    env = os.getenv("APP_ENV", "prod").lower()
    is_dev = env in {"dev", "development", "local"}

    console_level = console_level or os.getenv("APP_LOG_LEVEL", "INFO")
    log_dir = Path(log_dir or os.getenv("APP_LOG_DIR", "logs"))
    log_dir.mkdir(parents=True, exist_ok=True)

    # Start from a clean slate so we don't duplicate the default stderr handler.
    logger.remove()

    if enable_masking:
        logger.configure(patcher=_mask)

    # 1) Console: readable + colored, for humans.
    logger.add(
        sys.stderr,
        level=console_level,
        format=CONSOLE_FORMAT,
        colorize=True,
        backtrace=True,
        diagnose=is_dev,        # variable values only in dev — never leak in prod
        enqueue=True,
    )

    # 2) Structured JSON file: machine-parseable, for dashboards/alerts/forensics.
    logger.add(
        log_dir / "app_{time:YYYY-MM-DD}.jsonl",
        level="DEBUG" if is_dev else "INFO",
        serialize=True,         # one JSON object per line
        rotation="500 MB",
        retention="30 days",
        compression="zip",
        backtrace=True,
        diagnose=is_dev,
        enqueue=True,
    )

    # 3) Errors-only file kept longer, for incident review.
    logger.add(
        log_dir / "errors_{time:YYYY-MM-DD}.jsonl",
        level="ERROR",
        serialize=True,
        rotation="1 week",
        retention="90 days",
        compression="zip",
        backtrace=True,
        diagnose=is_dev,
        enqueue=True,
    )

    if intercept_stdlib:
        logging.basicConfig(handlers=[InterceptHandler()], level=0, force=True)

    logger.debug("Logging configured (env={}, console_level={})", env, console_level)


if __name__ == "__main__":
    # Tiny demo when run directly: python logging_config.py
    setup_logging(console_level="DEBUG")
    logger.info("Service starting")
    request_log = logger.bind(request_id="req-42", user_id=7)
    request_log.success("User authenticated")
    request_log.bind(password="hunter2").warning("Masking demo (password is redacted)")
    logger.opt(lazy=True).debug("Expensive value: {v}", v=lambda: sum(range(1_000_000)))
    try:
        1 / 0
    except ZeroDivisionError:
        logger.exception("Caught an error")
    logger.complete()  # flush enqueued messages before exit
