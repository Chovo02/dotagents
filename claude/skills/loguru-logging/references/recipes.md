# Loguru production recipes

Patterns for real applications. Each is self-contained — read the one you need.

- [Standard logging interception](#standard-logging-interception)
- [Data masking / redacting secrets](#data-masking--redacting-secrets)
- [Custom JSON serialization](#custom-json-serialization)
- [Per-request canonical log line](#per-request-canonical-log-line)
- [Rotating by size AND time](#rotating-by-size-and-time)
- [Function entry/exit & timing decorators](#function-entryexit--timing-decorators)
- [Changing a handler's level later](#changing-a-handlers-level-later)
- [Library vs application configuration](#library-vs-application-configuration)
- [Multiprocessing & Gunicorn/Uvicorn workers](#multiprocessing--gunicornuvicorn-workers)
- [Independent loggers](#independent-loggers)
- [Capturing stdout/stderr and warnings](#capturing-stdoutstderr-and-warnings)
- [Dynamic format / padding / colors](#dynamic-format--padding--colors)
- [Custom exception formatting](#custom-exception-formatting)
- [tqdm interoperability](#tqdm-interoperability)
- [Testing logs (pytest / unittest)](#testing-logs-pytest--unittest)
- [Network sinks](#network-sinks)

## Standard logging interception

Route stdlib `logging` records (and those from dependencies like FastAPI, Uvicorn,
SQLAlchemy, requests) into Loguru so everything shares one format and one set of sinks.
Install this right after configuring your sinks.

```python
import inspect
import logging
from loguru import logger

class InterceptHandler(logging.Handler):
    def emit(self, record: logging.LogRecord) -> None:
        # Map the stdlib level to a Loguru level if one exists.
        try:
            level = logger.level(record.levelname).name
        except ValueError:
            level = record.levelno
        # Find the caller frame so file:function:line are correct.
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

logging.basicConfig(handlers=[InterceptHandler()], level=0, force=True)
# For noisy libraries you can also do, e.g.:
# logging.getLogger("uvicorn.access").handlers = [InterceptHandler()]
```

To go the other way (push Loguru → stdlib), add a small `logging.Handler` whose `emit`
calls `logging.getLogger(record.name).handle(record)`.

## Data masking / redacting secrets

Strip sensitive fields before they reach any sink. Cleanest approach: a `patch()` that
sanitizes `extra`, plus keeping secrets out of the message text entirely.

```python
import re
from loguru import logger

SENSITIVE_KEYS = {"password", "token", "api_key", "secret", "authorization", "card"}
_CARD = re.compile(r"\b(?:\d[ -]*?){13,16}\b")

def mask(record):
    for key in list(record["extra"]):
        if key.lower() in SENSITIVE_KEYS:
            record["extra"][key] = "***REDACTED***"
    # Optional: scrub patterns from the message itself.
    record["message"] = _CARD.sub("***CARD***", record["message"])

logger = logger.patch(mask)
```

Also: set `diagnose=False` in production (variable values in tracebacks can leak
credentials), and treat any externally-controlled string as untrusted — pass it as an
argument (`logger.info("hello {u}", u=name)`), never concatenate into the template, to
avoid format-string and log-injection attacks. Restrict file permissions with an `opener`:

```python
import os
def opener(file, flags):
    return os.open(file, flags, 0o600)  # owner read/write only
logger.add("app.log", rotation="100 MB", opener=opener)
```

## Custom JSON serialization

`serialize=True` dumps the whole record. To control the shape (smaller, renamed fields,
your schema), serialize yourself:

```python
import json
from loguru import logger

def serialize(record):
    subset = {
        "ts": record["time"].timestamp(),
        "level": record["level"].name,
        "msg": record["message"],
        "logger": record["name"],
        **record["extra"],
    }
    if record["exception"]:
        subset["exception"] = repr(record["exception"].value)
    return json.dumps(subset, default=str)

# Option A: a sink function
def sink(message):
    print(serialize(message.record))
logger.add(sink)

# Option B: store it once via patch(), reuse across multiple sinks
def patching(record):
    record["extra"]["serialized"] = serialize(record)
logger = logger.patch(patching)
logger.add("app.log", format="{extra[serialized]}")
```

## Per-request canonical log line

Instead of dozens of micro-events, emit one summary entry per request/task. Accumulate
fields in the contextualized `extra` dict, log once at the end.

```python
import time
from loguru import logger

def handle_request(request):
    start = time.perf_counter()
    with logger.contextualize(request_id=request.id, user_id=request.user_id,
                              path=request.path, db_ms=0, outcome="ok"):
        try:
            result = do_work(request)   # inner code can add to extra via logger.contextualize
        except Exception:
            logger.bind(outcome="error").exception("Request failed")
            raise
        finally:
            elapsed = (time.perf_counter() - start) * 1000
            logger.bind(duration_ms=round(elapsed, 1)).info("request complete")
        return result
```

## Rotating by size AND time

`rotation` accepts size *or* time, not both — use a callable for both:

```python
import datetime

class Rotator:
    def __init__(self, *, size, at):
        now = datetime.datetime.now()
        self._size_limit = size
        self._time_limit = now.replace(hour=at.hour, minute=at.minute, second=at.second)
        if now >= self._time_limit:
            self._time_limit += datetime.timedelta(days=1)

    def should_rotate(self, message, file):
        file.seek(0, 2)
        if file.tell() + len(message) > self._size_limit:
            return True
        excess = message.record["time"].timestamp() - self._time_limit.timestamp()
        if excess >= 0:
            self._time_limit += datetime.timedelta(days=datetime.timedelta(seconds=excess).days + 1)
            return True
        return False

rotator = Rotator(size=5e8, at=datetime.time(0, 0, 0))  # 500 MB or midnight
logger.add("file.log", rotation=rotator.should_rotate)
```

## Function entry/exit & timing decorators

```python
import functools, time
from loguru import logger

def logger_wraps(*, entry=True, exit=True, level="DEBUG"):
    def wrapper(func):
        name = func.__name__
        @functools.wraps(func)
        def wrapped(*args, **kwargs):
            log = logger.opt(depth=1)   # depth=1 so the *caller* site is reported
            if entry:
                log.log(level, "Entering '{}' (args={}, kwargs={})", name, args, kwargs)
            result = func(*args, **kwargs)
            if exit:
                log.log(level, "Exiting '{}' (result={})", name, result)
            return result
        return wrapped
    return wrapper

def timeit(func):
    @functools.wraps(func)
    def wrapped(*args, **kwargs):
        start = time.time()
        result = func(*args, **kwargs)
        logger.debug("Function '{}' executed in {:f}s", func.__name__, time.time() - start)
        return result
    return wrapped
```

## Changing a handler's level later

Handlers are immutable. Either remove + re-add, or use a level-aware filter you can flip:

```python
handler_id = logger.add(sys.stderr, level="WARNING")
logger.remove(handler_id)
logger.add(sys.stderr, level="DEBUG")

# Or a mutable threshold via filter:
min_level = logger.level("DEBUG").no
logger.add(sys.stderr, filter=lambda r: r["level"].no >= min_level, level=0)
min_level = logger.level("WARNING").no   # now DEBUG is filtered out
```

## Library vs application configuration

- **Application**: configure at the entry point, ideally under `if __name__ == "__main__":`.
- **Library**: do **not** add handlers. In your package `__init__.py`, call
  `logger.disable("your_package")` so you don't spam the user. Optionally expose a
  `configure_logging()` helper. Users opt in with `logger.enable("your_package")`.

Identify origin with `record["name"]` or per-module files:
```python
logger.add("module_1.log", filter="module_1")
```

## Multiprocessing & Gunicorn/Uvicorn workers

- Use `enqueue=True` on file sinks (multiprocess-safe, non-blocking) and call
  `logger.complete()` before a child exits.
- **Linux** (fork): children inherit handlers automatically.
- **Windows** (spawn): pass the `logger` as an `initializer`/`initargs` argument or via
  `Process(target=fn, args=(logger,))`; sinks must be picklable (so `remove()` the default
  `sys.stderr` sink first and rely on `enqueue=True`). Inside the child, set the global or
  call `logger.reinstall()`.
- **Gunicorn/Uvicorn** start multiple workers: adding the same file path in each worker
  duplicates/trims files. Configure once in the master, or run a log server/socket sink and
  have workers send to it. Guard config so it isn't re-run per worker.

```python
import multiprocessing
from loguru import logger

def child():
    logger.info("from child")
    logger.complete()

if __name__ == "__main__":
    logger.add("file.log", enqueue=True)
    p = multiprocessing.Process(target=child)
    p.start(); p.join()
```

## Independent loggers

Loguru is one global logger by design. To split logs per task, combine `bind()` + `filter`:

```python
logger.add("file_A.log", filter=lambda r: r["extra"].get("task") == "A")
logger.bind(task="A").info("only in file_A")
```

For many such loggers, `copy.deepcopy(logger)` gives a truly separate handler set (remove
non-picklable handlers before copying).

## Capturing stdout/stderr and warnings

```python
import contextlib, sys
from loguru import logger

class StreamToLogger:
    def __init__(self, level="INFO"): self._level = level
    def write(self, buffer):
        for line in buffer.rstrip().splitlines():
            logger.opt(depth=1).log(self._level, line.rstrip())
    def flush(self): pass

logger.remove()
logger.add(sys.__stdout__)          # use the real stdout to avoid a feedback loop
with contextlib.redirect_stdout(StreamToLogger()):
    print("captured into the logger")

# Capture warnings:
import warnings
_orig = warnings.showwarning
def showwarning(message, *a, **k):
    logger.opt(depth=2).warning(message); _orig(message, *a, **k)
warnings.showwarning = showwarning
```

## Dynamic format / padding / colors

```python
# Align variable-width fields with padding directives:
fmt = "{time} | {level: <8} | {name: ^15}:{function: ^15}:{line: >3} | {message}"
logger.add(sys.stderr, format=fmt)

# Format function MUST return a template (with {placeholders}), not a formatted string,
# and must append "\n{exception}" itself:
def formatter(record):
    if record["level"].no >= 40:
        return "<red>{time} {level} {message}</red>\n{exception}"
    return "{time} {level} {message}\n{exception}"
logger.add(sys.stderr, format=formatter)
```

## Custom exception formatting

`backtrace=True` extends the trace above the catch point; `diagnose=True` annotates
variable values (dev only). For richer traces, format via a library like `stackprinter`
inside a format function and stash the result in `record["extra"]`.

## Testing logs (pytest / unittest)

`pytest`'s `caplog` hooks stdlib logging, so propagate Loguru into it via a fixture in
`conftest.py`:

```python
import pytest
from loguru import logger

@pytest.fixture(autouse=True)
def propagate_logs(request):
    plugin = request.config.pluginmanager.getplugin("logging-plugin")
    logger.remove()
    ids = []
    for h in [plugin.caplog_handler, plugin.log_cli_handler, plugin.report_handler]:
        ids.append(logger.add(h, format="{message}", level=0))
    yield
    for i in ids:
        logger.remove(i)
```

For `unittest`, add `output.append` as a sink to capture messages:
```python
from contextlib import contextmanager
@contextmanager
def capture_logs(level="INFO", format="{level}:{name}:{message}"):
    output = []
    hid = logger.add(output.append, level=level, format=format)
    yield output
    logger.remove(hid)
```
Each captured item is a `Message` whose `.record` you can assert on. (The `pytest-loguru`
package also exists.)

## Network sinks

Send records to another process/host with a custom sink + `patch()` on the receiver, or
use `zmq`'s `PUBHandler` as a stdlib handler sink. If you pickle records over a socket,
**sign them with HMAC** and verify before `pickle.loads` — pickling untrusted data is a
remote-code-execution risk.
