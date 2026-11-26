# Loguru API reference

Quick navigation:
- [The single logger](#the-single-logger)
- [`add()` — registering sinks](#add--registering-sinks)
- [File sinks: rotation / retention / compression](#file-sinks-rotation--retention--compression)
- [The record dict](#the-record-dict)
- [Time format tokens](#time-format-tokens)
- [Color markup](#color-markup)
- [Log methods & custom levels](#log-methods--custom-levels)
- [`opt()` — per-call modifiers](#opt--per-call-modifiers)
- [`bind()`, `contextualize()`, `patch()`](#bind-contextualize-patch)
- [`catch()` — exception capture](#catch--exception-capture)
- [`remove()`, `complete()`, `configure()`, `enable()`/`disable()`, `parse()`](#other-methods)
- [Environment variables](#environment-variables)
- [Type hints](#type-hints)

## The single logger

There is exactly **one** pre-instanced logger. Import it everywhere; never instantiate or
"get" a named logger:

```python
from loguru import logger
logger.debug("Beautiful and simple logging!")
```

It is pre-configured to write to `sys.stderr`. The logger itself has no level — each
*handler* (sink) decides its own minimum level.

## `add()` — registering sinks

```python
logger.add(sink, *, level="DEBUG", format=<default>, filter=None, colorize=None,
           serialize=False, backtrace=True, diagnose=True, enqueue=False,
           context=None, catch=True, **kwargs)
```

Returns an `int` handler id (use it with `remove()`).

A **sink** can be:
- a file-like object (`sys.stderr`, an open file) — anything with `.write()`;
- a `str`/`pathlib.Path` file path (enables the file-only params below);
- a callable, e.g. `lambda msg: print(msg)` — full custom handling;
- an `async def` coroutine function (await with `complete()`);
- a stdlib `logging.Handler` (records are auto-converted).

Key parameters:
- **level** (`int`/`str`): minimum severity passed to this sink.
- **format** (`str`/callable): template. As a string, `"\n{exception}"` is appended
  automatically. As a function it must **return an unformatted template string** (with
  `{}` placeholders) and is responsible for appending `\n{exception}` itself — returning
  an already-formatted string raises errors.
- **filter** (callable/`str`/`dict`): decide per-record whether to log. A callable takes
  the record and returns bool. A string allows only that module name and children. A dict
  maps module names to a minimum level (`int`, level name, or `True`/`False`); `""` is the
  default for all modules.
- **colorize** (`bool`): convert color markup to ANSI, or strip it. `None` auto-detects
  via `isatty()`.
- **serialize** (`bool`): emit each record as a JSON string (structured logging).
- **backtrace** (`bool`): extend exception traceback above the catch point.
- **diagnose** (`bool`): annotate tracebacks with variable values. **Set `False` in
  production** — it can leak secrets.
- **enqueue** (`bool`): route messages through a multiprocess-safe queue; makes calls
  non-blocking. Recommended for file sinks and required for async sinks.
- **context** (`multiprocessing.Context`/`str`): context used for the internal queue when
  `enqueue=True`.
- **catch** (`bool`): if the sink raises, print to stderr instead of crashing the app.

Default format:
```
<green>{time:YYYY-MM-DD HH:mm:ss.SSS Z}</green> | <level>{level: <8}</level> | <cyan>{name}</cyan>:<cyan>{function}</cyan>:<cyan>{line}</cyan> - <level>{message}</level>
```

The default format string is not exposed programmatically — copy it explicitly if you want
to extend it.

## File sinks: rotation / retention / compression

Only valid when the sink is a path. A `{time}` field in the path is filled at file
creation.

**rotation** — close current file and start a new one when the condition is met:
- `int` → max size in bytes; `"500 MB"`, `"0.5 GB"` → human size;
- `datetime.timedelta` or `"1 week"`, `"4 days"`, `"10h"` → frequency;
- `datetime.time` or `"18:00"`, `"monday at 12:00"`, `"sunday"`, `"w0"`, `"monthly"` → schedule;
- a callable `(message, file) -> bool`.

**retention** — clean up old files (at rotation or at exit):
- `int` → number of files to keep; `datetime.timedelta` or `"1 week, 3 days"`, `"2 months"` → max age;
- a callable `(list_of_paths) -> None` for custom handling.

**compression** — archive at rotation/exit: `"gz"`, `"bz2"`, `"xz"`, `"lzma"`, `"tar"`,
`"tar.gz"`, `"tar.bz2"`, `"tar.xz"`, `"zip"`, or a callable `(path) -> None`.

Other file params (passed to `open()`): `delay`, `watch`, `mode` (default `"a"`),
`buffering` (default `1`, line-buffered), `encoding` (default `"utf8"`), `opener`,
`errors`, etc.

> ⚠️ Never call the `logger` inside a custom rotation/retention/compression/format
> callable — it can deadlock.

## The record dict

Each log produces a `record` dict, accessible from a sink via `message.record` and usable
in format strings as `{key}` (or `{key.attr}`):

| Key | Meaning | Notable attributes |
|-----|---------|--------------------|
| `elapsed` | time since program start | `timedelta` |
| `exception` | formatted exception or `None` | `type`, `value`, `traceback` |
| `extra` | user-bound context dict (`bind()`) | — |
| `file` | source file | `name`, `path` |
| `function` | calling function | — |
| `level` | severity | `name`, `no`, `icon` |
| `line` | line number | — |
| `message` | the (unformatted) message | — |
| `module` | calling module | — |
| `name` | `__name__` at call site | — |
| `process` | process | `name`, `id` |
| `thread` | thread | `name`, `id` |
| `time` | timezone-aware local datetime | `datetime` |

## Time format tokens

Use inside `{time:...}`, a Pendulum subset. Append `!UTC` to format in UTC (e.g.
`{time:HH:mm:ss!UTC}`). Escape literals with brackets: `[YY]`. No specifier → ISO 8601.

`YYYY`/`YY` year · `Q` quarter · `MMMM`/`MMM`/`MM`/`M` month · `DDDD`/`DDD` day-of-year ·
`DD`/`D` day-of-month · `dddd`/`ddd`/`d` weekday · `E` ISO weekday · `HH`/`H` 24h ·
`hh`/`h` 12h · `mm`/`m` minute · `ss`/`s` second · `S`…`SSSSSS` fractional second ·
`A` AM/PM · `Z`/`ZZ`/`zz` timezone · `X` unix seconds · `x` unix microseconds.

Standard `str.format()` spec also works for alignment/padding, e.g. `{level: <8}`,
`{line: >3}`.

## Color markup

Wrap parts of the format in tags; `</>` closes the last tag; `<level>`/`<lvl>` uses the
record level's configured color.

- Foreground basic: `<red>`/`<r>`, `<green>`/`<g>`, `<blue>`/`<e>`, `<cyan>`/`<c>`,
  `<magenta>`/`<m>`, `<yellow>`/`<y>`, `<black>`/`<k>`, `<white>`/`<w>`.
- Light variants: `<light-blue>`/`<le>`, etc. Background = uppercase (`<GREEN>`, `<G>`).
- 8-bit: `<fg 86>` / `<bg 42>`; hex: `<fg #00005f>` / `<bg #fff>`; rgb: `<fg 0,95,0>`.
- Styles: `<bold>`/`<b>`, `<dim>`/`<d>`, `<italic>`/`<i>`, `<underline>`/`<u>`,
  `<strike>`/`<s>`, `<reverse>`/`<v>`, `<blink>`/`<l>`, `<hide>`/`<h>`, `<normal>`/`<n>`.

Unknown tags raise during parsing. Escape a literal tag with `\<blue>`. Honors `NO_COLOR`
and `FORCE_COLOR` env vars; on Windows uses colorama.

## Log methods & custom levels

`logger.trace/debug/info/success/warning/error/critical(msg, *args, **kwargs)` —
`msg.format(*args, **kwargs)` at the corresponding severity.

`logger.exception(msg, ...)` — an `ERROR` that also captures the current exception (call
inside an `except` block).

`logger.log(level, msg, ...)` — log at a named or anonymous level. Passing an `int`
produces an anonymous level shown as `"Level NN"`; Loguru maps level *names* to severities,
not the reverse, so always log custom levels by **name**.

Create/update/retrieve a level:
```python
logger.level("NOTICE", no=33, color="<blue>", icon="🔔")  # add
logger.level("WARNING", icon="/!\\")                       # update (no cannot change)
lvl = logger.level("ERROR")  # Level(name='ERROR', no=40, color='<red><bold>', icon='')
```

Add a convenience method for a custom level (survives bind/opt/patch):
```python
from functools import partialmethod
logger.__class__.notice = partialmethod(logger.__class__.log, "NOTICE")
logger.notice("A message")
```

## `opt()` — per-call modifiers

`logger.opt(*, exception=None, record=False, lazy=False, colors=False, raw=False, capture=True, depth=0)`
returns a logger wrapper for the **next** call. Calls don't chain (last wins).

- `exception=True` (or an exc tuple) — attach traceback.
- `record=True` — allow `{record[key]}` in the message.
- `lazy=True` — message args are zero-arg callables, invoked only if the level passes.
- `colors=True` — interpret color tags in this message.
- `raw=True` — bypass sink formatting, write the message as-is.
- `capture=False` — keep kwargs out of `extra` (still used for formatting).
- `depth=N` — attribute the call to a parent frame (use inside wrappers/decorators).

## `bind()`, `contextualize()`, `patch()`

- **`bind(**kwargs)`** → a new logger whose records carry the given keys in `extra`. Good
  for per-object/per-request context: `log = logger.bind(ip=ip, user=user)`.
- **`contextualize(**kwargs)`** → context manager / decorator that mutates the
  *context-local* `extra` for the duration of a block; uses `contextvars`, so values are
  isolated per thread and per async task. Ideal for request/trace ids.
- **`patch(fn)`** → attach a function that mutates each record (e.g. add dynamic values
  like UTC time, computed fields) before it reaches sinks. Modify `record["extra"]` rather
  than the record root. Multiple patches run in order.

Reference these keys in the format, e.g. `format="{extra[ip]} {extra[user]} {message}"`.

## `catch()` — exception capture

```python
@logger.catch                      # decorator
def f(x): return 1 / x

with logger.catch(message="..."):  # context manager
    main()
```
Params: `exception=Exception`, `level="ERROR"`, `reraise=False`, `onerror=callable`,
`exclude=ExcType`, `default=value`, `message=...`. Especially useful to wrap
`Thread.run()` so thread errors are not silently swallowed. Variable visibility in the
trace follows each sink's `diagnose`.

## Other methods

- **`remove(handler_id=None)`** — remove one handler (or all if `None`). Default handler is
  id `0`. Handlers can't be edited in place — remove and re-add to change level/format.
- **`complete()`** — wait for all `enqueue=True` messages and async tasks to finish; call
  before a child process exits, and `await` it inside async code.
- **`configure(*, handlers=None, levels=None, extra=None, patcher=None, activation=None)`**
  — bulk setup. `handlers` is a list of `add()` kwargs dicts (replaces existing handlers);
  `extra` sets global context for all modules; `activation` is a list of
  `(name, enable_bool)`. Returns the list of new handler ids.
- **`enable(name)` / `disable(name)`** — turn logging from a module (and children) on/off.
  Libraries should `disable("their_package")` at import; applications `enable()` it. Use
  `disable(None)` for modules where `__name__` is missing.
- **`parse(file, pattern, *, cast={}, chunk=65536)`** — extract structured entries from
  raw logs using a regex with named groups; `cast` converts matched groups (e.g.
  `dict(level=int, time=dateutil.parser.parse)`).
- **`reinstall()`** — re-attach the logger core inside a spawned multiprocessing child
  when the logger was passed as an argument.

## Environment variables

Every `add()` default can be overridden by `LOGURU_<PARAM>`, e.g.
`LOGURU_LEVEL="WARNING"`, `LOGURU_FORMAT="{time} - {message}"`. Per-level attributes via
`LOGURU_<LEVEL>_<ATTR>`, e.g. `LOGURU_DEBUG_COLOR="<blue>"`. `LOGURU_DIAGNOSE=NO` disables
variable values in tracebacks. `LOGURU_AUTOINIT=False` disables the pre-configured sink.
`NO_COLOR` / `FORCE_COLOR` are also honored.

## Type hints

Types live in a stub file (need `from __future__ import annotations` on older Pythons):
`loguru.Logger`, `loguru.Message` (the str sent to sinks, with `.record`),
`loguru.Record`, `loguru.Level`, `loguru.Catcher`, `loguru.Contextualizer`,
`loguru.AwaitableCompleter`, and the record sub-objects `RecordFile`, `RecordLevel`,
`RecordThread`, `RecordProcess`, `RecordException`.
