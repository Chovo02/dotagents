---
name: loguru-logging
description: Add strategic, production-grade logging to Python code using Loguru. Use this skill whenever the user wants to add logging, instrument code, set up a logger, replace print() statements with logs, configure log files with rotation/retention, produce structured/JSON logs, trace requests across a codebase, mask sensitive data in logs, or debug by adding log statements — even if they don't explicitly say "Loguru". Trigger on phrases like "add logging", "log this function", "set up a logger", "I need to see what's happening", "instrument this", "make this debuggable", "log to a file", "structured logs", or when the user shares Python code and asks to make its behavior observable. Prefer this over hand-rolling the standard `logging` module.
---

# Strategic logging in Python with Loguru

Logging is **precognitive debugging**: you leave intelligent breadcrumbs today for the
incident you'll be debugging at 3 a.m. tomorrow. The goal of this skill is not to scatter
`logger.info("here")` everywhere, but to instrument code so its output reads like a
coherent story of what happened, with enough context to reproduce any problem — while
keeping logs cheap, safe, and machine-parseable.

Loguru is the right tool because it removes the boilerplate of the standard `logging`
module (no Handler/Formatter/Filter ceremony) while giving you rotation, JSON
serialization, colors, rich exception tracebacks, and context binding out of the box.

## How to approach a logging task

1. **Decide what is worth tracing before writing any code.** Ask: what are the primary
   user actions? Which system events are critical (startup, shutdown, external calls,
   payments, auth)? What would you desperately want to know during an incident? Log those
   *key events*, not every line. Blind logging produces noise, high ingestion cost, and
   no actionable signal.
2. **Configure the logger once, at the entry point** — never per-module. Other modules
   just `from loguru import logger` and use it. Use the template in
   `assets/logging_config.py` as the starting point; adapt sinks, levels, and paths to
   the project. If the project is a *library* (not an application), do NOT add handlers —
   call `logger.disable("your_package")` instead and let the user enable it.
3. **Instrument the code** with well-placed, well-leveled, context-rich statements
   (see below).
4. **Verify**: check that secrets are never logged, that `diagnose` is off in production,
   and that levels are used consistently.

## Configuration essentials

The default logger ships with one handler writing to `sys.stderr`. Before adding your own
console handler, call `logger.remove()` first, otherwise messages get **duplicated**.

A solid application setup separates two concerns:
- A **human-readable, colored console sink** (usually `sys.stderr`) for development.
- One or more **structured file sinks** with `serialize=True` (JSON), rotation, retention
  and compression for production and machine parsing.

```python
from loguru import logger
import sys

logger.remove()  # drop the default handler to avoid duplicate logs
logger.add(sys.stderr, level="INFO", backtrace=True, diagnose=False)
logger.add(
    "logs/app_{time:YYYY-MM-DD}.log",
    level="DEBUG",
    rotation="500 MB",       # also accepts "00:00", "1 week", a timedelta, or a callable
    retention="10 days",     # delete files older than this
    compression="zip",       # archive rotated files
    serialize=True,          # one JSON object per line — searchable, dashboard-ready
    enqueue=True,            # non-blocking + multiprocess-safe writes
    backtrace=True,
    diagnose=False,          # CRITICAL in prod: variable values can leak secrets
)
```

`logger.add()` returns an id; keep it if you need to `logger.remove(id)` later (handlers
cannot be reconfigured in place — remove and re-add). Defaults can also be set via
environment variables like `LOGURU_LEVEL` and `LOGURU_FORMAT`.

For the full configuration surface — every `add()` parameter, rotation/retention/
compression rules, the `{time}` format tokens, color markup, the record dict, custom
levels, `parse()`, `configure()` — read `references/api-reference.md`.

## Choosing the right level

Loguru adds `trace()` and `success()` to the standard set. Use levels consistently across
the codebase so alerts stay meaningful (inconsistent levels cause alert fatigue). In
high-traffic production a sensible default threshold is often `INFO` or even `WARNING`,
not `DEBUG`, to control ingestion cost.

| Level    | Severity | When to use it |
|----------|----------|----------------|
| TRACE    | 5        | Extremely granular flow, deepest debugging. Off by default. |
| DEBUG    | 10       | Developer detail (intermediate values, branch taken). Disable in prod. |
| INFO     | 20       | Expected, business-as-usual events ("Order #12345 completed"). |
| SUCCESS  | 25       | A notable operation finished successfully. |
| WARNING  | 30       | Anomaly that doesn't break anything but signals degradation ("Payment took >5s"). |
| ERROR    | 40       | A function failed; the system stays up. |
| CRITICAL | 50       | Total/partial crash needing immediate intervention. |

## Writing strategic log statements

**Use brace-style formatting, and pass arguments — don't pre-format.** Loguru calls
`str.format()` lazily, so if the level is filtered out the formatting cost is skipped.

```python
logger.info("User {user_id} completed checkout for order {order_id}", user_id=u, order_id=o)
# NOT: logger.info(f"User {u} completed checkout for order {o}")  # eager, always formats
```

**Attach structured context, don't bury it in prose.** Every log should let someone answer
*who, what, when, where*. Use `bind()` for context that persists across calls and
`contextualize()` for context scoped to a block (request id, task id, trace id):

```python
request_logger = logger.bind(request_id=req_id, user_id=user_id)
request_logger.info("Processing payment")        # request_id/user_id ride along in extra

with logger.contextualize(trace_id=trace_id):     # thread- and async-safe via contextvars
    handle_request()
```

**Log near the `return`, roughly one log per method.** The return value (or the chosen
branch) is usually the single most informative thing about why a method behaved as it did.
Resist sprinkling logs at every line.

**Emit a canonical log line per request.** For request/response or task-style work, a
single summary entry at the end (who, what, duration, DB time, outcome) is the "TL;DR" of
the operation and beats sifting through dozens of micro-events. Build it by accumulating
fields in the bound/contextualized `extra` dict and logging once at completion.

**Capture exceptions properly** rather than logging a bare message:
- Inside an `except` block: `logger.exception("Payment failed")` — automatically attaches
  the traceback.
- To guard a function or thread: the `@logger.catch` decorator / context manager ensures
  errors (even in threads) reach the logger instead of vanishing.

**Lazy-evaluate expensive diagnostics** so they cost nothing when the level is off:

```python
logger.opt(lazy=True).debug("Permissions: {p}", p=lambda: compute_expensive_permissions())
```

## Things to avoid (they cause real bugs and cost)

- **No work inside log calls.** Never `logger.info(obj.mutate_and_return())`. A logging
  call must be a pure observation; side effects or heavy computation there create
  Heisenbugs that only appear when logging is enabled, and tank performance. Use
  `opt(lazy=True)` for costly read-only values.
- **No logging inside tight loops.** It saturates I/O. Aggregate and log once before/after
  the loop, or sample (see below).
- **No custom wrapper around the logger.** Wrapping/abstracting Loguru breaks `opt`,
  `bind`, depth tracking, and third-party integrations, and adds complexity for nothing.
  Import the global `logger` directly. To add a method for a custom level, attach it to
  `logger.__class__` via `partialmethod` (see `references/recipes.md`).
- **Don't add the same file sink twice** (e.g. unguarded under `multiprocessing`) — it
  duplicates or truncates files. Guard configuration with `if __name__ == "__main__":`.

## Security and privacy — non-negotiable

Logs are the system's black box; mishandled, they become a breach. Real leaks (passwords
in cleartext) have happened at major companies.

- **Never log** passwords, full credit-card numbers, API keys, tokens, or PII.
- **Set `diagnose=False` in production** (or `LOGURU_DIAGNOSE=NO`). When on, Loguru prints
  the *values* of variables in tracebacks — extremely handy in dev, a credential leak in
  prod.
- **Mask/redact sensitive fields** before they hit a sink (via a `patch()` function, a
  custom serializer, or a filter). See `references/recipes.md` → data masking.
- **Beware log injection and format-string attacks** from untrusted input: pass user data
  as an argument (`logger.info("User {u} in", u=name)`), never concatenate it into the
  template, and escape newlines if needed.
- **Restrict file permissions** with the `opener` argument (e.g. `0o600`) so logs aren't
  world-readable.

## Performance and lifecycle

- Use `enqueue=True` for file sinks to make writes non-blocking and multiprocess-safe.
- **Sample** in high-traffic paths: keep 100% of errors but a fraction of successes (a
  level-aware `filter` function) to cut volume dramatically while preserving signal.
- Set **retention** per category (e.g. debug ~7 days, error ~90 days, audit ~1 year) so
  storage and compliance are handled by config, not manual cleanup.
- Logs answer **WHAT happened** (forensics); metrics answer **HOW OFTEN** (real-time
  monitoring). Don't try to rebuild metrics out of log scraping.

## Interop with the standard library

If the project (or its dependencies, e.g. FastAPI, Uvicorn, SQLAlchemy) uses the standard
`logging` module, route those records into Loguru with an `InterceptHandler` so everything
lands in one place with one format. The complete, copy-pasteable handler and setup is in
`references/recipes.md` → standard logging interception. Apply it right after configuring
your sinks.

## Reference files

- `references/api-reference.md` — Complete Loguru API: `add` and all its parameters, the
  record dict, time tokens, color markup, custom levels, `opt`/`bind`/`contextualize`/
  `patch`/`catch`, `configure`, `parse`, environment variables. Read this when you need a
  parameter you don't remember exactly.
- `references/recipes.md` — Production patterns: standard-logging interception, data
  masking, custom JSON serialization, size+time rotation, per-request canonical lines,
  function entry/exit decorators, multiprocessing/Gunicorn, pytest/testing, tqdm, network
  sinks. Read this for any non-trivial setup.
- `assets/logging_config.py` — A ready-to-adapt `setup_logging()` module implementing the
  recommendations above (console + JSON file sinks, env-driven level, stdlib interception,
  optional masking hook). Copy it into the project and tailor it.
