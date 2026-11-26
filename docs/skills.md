# Catalogo delle skill

Le due configurazioni hanno skill proprie, che possono divergere ([ADR 0005](adr/0005-potatura-per-ruolo.md)): il dominio condiviso (design, qualità, ML, sicurezza, docker) è in entrambe, il resto solo dove serve. Una *skill* guida l'agent principale; un *agent* lavora in un contesto separato ([agents.md](agents.md)). Le attribuzioni complete stanno nel `THIRD-PARTY-NOTICES.md` di ogni skill. Sulle skill di Matt Pocock: [ADR 0004](adr/0004-skill-di-matt-pocock-adozione-selettiva.md).

Provenienza: **Pocock** = `mattpocock/skills` (MIT); **ECC** = `affaan-m/ECC` (MIT); **propria** = senza notice (non verificato se derivata); altre fonti indicate per esteso.

## Pianificazione e design
| Skill | Quando | Provenienza |
|---|---|---|
| `grilling` | Interrogatorio a round su un piano o una decisione | Pocock |
| `grill-me` | Entry point manuale (`/grill-me`) che chiama `grilling`; variante Claude e adattamento Codex | Pocock |
| `grill-me-pro` | Act 1 = `grilling`, Act 2 = revisione di un sub-agent a contesto pulito della stessa configurazione; lenta e costosa, solo su richiesta o piani molto complessi | Pocock + propria |
| `grill-with-docs` | Come `grilling`, ma produce glossario e ADR durante la sessione | Pocock |
| `domain-modeling` | Costruire `GLOSSARY.md` e ADR | Pocock |
| `codebase-design` | Vocabolario dei moduli profondi, interfacce, seam | propria |
| `improve-codebase-architecture` | Cercare opportunità di approfondimento, poi grill; variante Claude e adattamento Codex | propria |
| `prototype` | Prototipo usa-e-getta per rispondere a una domanda di design | Pocock |
| `to-questionnaire` (solo lavoro) | Trasformare una decisione in questionario per un'altra persona | Pocock |

## Qualità e debug
| Skill | Quando | Provenienza |
|---|---|---|
| `tdd` | Sviluppo test-first | Pocock |
| `diagnosing-bugs` | Bug difficili e regressioni di prestazioni | Pocock |
| `verification-loop` | Verifica Python prima di dichiarare finito (tipi, ruff, pytest, scansione) | ECC |
| `wait-what` | Riformulare l'ultimo messaggio quando non è arrivato | Pocock |

## ML
| Skill | Quando | Provenienza |
|---|---|---|
| `python-ml-tooling` | uv, ruff, pytest, `pyproject.toml` | Martin Richards (`python-skills`) |
| `ml-debugging` | Loss NaN, plateau, risultati non riproducibili | `obra/superpowers` |
| `pandas-polars` | Scegliere e scrivere codice pandas o Polars | `polars-inc/skills` |
| `ml-experiment-hygiene` | Split, tracking (MLflow/ClearML), confronto onesto tra modelli | propria |

## Sicurezza e infra
| Skill | Quando | Provenienza |
|---|---|---|
| `api-security` | Revisione di API con OWASP Top 10:2025 e ASVS 5.0 L1 | `agamm/claude-code-owasp` |
| `docker-python` | Dockerfile e Compose per servizi Python e ML | `anmolnagpal/devops-skills` |

## Documentazione e rilascio
| Skill | Quando | Provenienza |
|---|---|---|
| `readme` | Creare o verificare un README, solo su richiesta | `adewale/good-readme` |
| `changelog-release-notes` (solo personale) | CHANGELOG e note di rilascio dalla storia git | Tilo Mitra (`release-kit-claude-skills`) |
| `writing-great-skills` (solo personale) | Scrivere e modificare skill | propria |
| `loguru-logging` | Logging Python con Loguru (mai `logging`/`print`) | skill di account Anthropic, licenza non verificata |

## Sessione
| Skill | Quando | Provenienza |
|---|---|---|
| `handoff` | Compattare la conversazione per un altro agent | Pocock |

## Cortex
In Codex 11 skill `cortex-*` (`canvas`, `digest`, `ingest`, `maintenance`, `obsidian-vault`, `query`, `recall`, `research`, `review`, `session-log`, `sketch`) rimandano ai file del Plugin Cortex; in Claude Cortex è un Plugin da marketplace (`plugins.json`). `meeting` e `task` esistono solo nel lavoro. Prerequisiti e vault: [codex.md](codex.md), [mcp.md](mcp.md).

## Varianti per agent
`grill-me`, `grill-me-pro` e `improve-codebase-architecture` hanno una versione Claude e un adattamento Codex; `grill-me` e `improve-codebase-architecture` mantengono l'invocazione esplicita.
