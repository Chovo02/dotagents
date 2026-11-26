# dotagents

Configurazione versionata dei miei agent di codice: **Claude Code per il lavoro**, **Codex per i progetti personali**. `install.mjs` (Node, Windows/Linux/macOS) collega il repo a `~/.claude` e a `~/.codex`.

Le due configurazioni non sono in parità: ruoli in [ADR 0001](docs/adr/0001-divisione-lavoro-personale.md), criterio di potatura in [ADR 0005](docs/adr/0005-potatura-per-ruolo.md). Il vocabolario usato qui (Skill, Agent, Mod, Plugin, Profilo, ...) è in [GLOSSARY.md](GLOSSARY.md).

## Quick start
```bash
git clone <url> && cd dotagents
node install.mjs plan     # cosa cambierebbe (non modifica nulla)
node install.mjs apply    # applica; i file sostituiti vanno in backup/<data>/
node install.mjs restore  # torna all'ultimo backup
```
Opzioni, variabili e note per OS: [docs/installer.md](docs/installer.md).

## Mappa del repo
| Percorso | Contenuto |
|---|---|
| `claude/` | Configurazione di lavoro (ML e AI dev): `CLAUDE.md`, `settings.<os>.json`, `agents/`, `skills/`, `hooks/`, `mods/`, `statusline/`, `themes/`, `plugins.json` |
| `codex/` | Configurazione personale (siti, ML, AI, homelab): `AGENTS.md`, `config.toml` (base copiata una volta), `rules/`, `agents/`, `skills/` |
| `docs/` | Dettaglio: installer, Codex, catalogo skill e agent, MCP, ADR |
| `backup/` | Originali sostituiti dall'installer (non versionato) |
| `install.mjs` | Installer unico |

## Skill
Procedure che l'agent carica quando serve. Dominio condiviso in entrambe le configurazioni; il resto solo dove serve.

| Categoria | Skill |
|---|---|
| Pianificazione e design | `grilling`, `grill-me`, `grill-me-pro`, `grill-with-docs`, `domain-modeling`, `codebase-design`, `improve-codebase-architecture`, `prototype`, `to-questionnaire` (solo lavoro) |
| Qualità e debug | `tdd`, `diagnosing-bugs`, `verification-loop`, `wait-what` |
| ML | `python-ml-tooling`, `ml-debugging`, `pandas-polars`, `ml-experiment-hygiene` |
| Sicurezza e infra | `api-security`, `docker-python`, `loguru-logging` |
| Documentazione e rilascio | `readme`; solo personale: `changelog-release-notes`, `writing-great-skills` |
| Sessione | `handoff` |
| Cortex | Plugin in Claude; 11 skill `cortex-*` in Codex |

Quando usarle, provenienza e licenze: [docs/skills.md](docs/skills.md). Perché solo alcune skill di Matt Pocock: [ADR 0004](docs/adr/0004-skill-di-matt-pocock-adozione-selettiva.md).

## Agent
Sotto-agenti con contesto pulito e tool limitati. Cinque in `claude/agents/` (lavoro), sei in `codex/agents/` (personale).

| Ruolo | Agent |
|---|---|
| Revisori in sola lettura | `code-reviewer`, `ml-reviewer`, `pr-reviewer` (solo Codex) |
| Ricerca ed esplorazione | `Explore`, `researcher` |
| Esecuzione | `test-runner` |

Modelli, tool e regole d'uso: [docs/agents.md](docs/agents.md).

## Hook e guardrail
`hooks/guard.js` blocca comandi shell pericolosi ed è condiviso da Claude e Codex (test: `node --test claude/hooks/guard.test.js`). `hooks/ruff-check.js` esegue `ruff check` su file `.py` ed è solo Claude. Per Codex si aggiungono le regole `codex/rules/dotagents.rules` con i limiti descritti in [docs/codex.md](docs/codex.md).

## Solo Claude Code
Mod (`jev-router`), status line, tema, Chrome host, `plugins.json` e `settings.<os>.json`. Il mod è un file del repo, non un repo annidato ([ADR 0003](docs/adr/0003-mod-versionati-in-tree.md)). Tabella completa con equivalenti Codex: [docs/codex.md](docs/codex.md).

## Cosa non è tracciato
Credenziali, `~/.claude.json`, history, sessioni, cache dei plugin e `backup/`: runtime o segreti (vedi `.gitignore`).

## Altri documenti
- [docs/installer.md](docs/installer.md): installer, cosa è collegato e cosa copiato ([ADR 0002](docs/adr/0002-cartelle-linkate-e-backup-nel-repo.md))
- [docs/codex.md](docs/codex.md): sicurezza, profili, Cortex, gap rispetto a Claude
- [docs/mcp.md](docs/mcp.md): vault Cortex, server MCP per Claude e Codex, checklist dei connettori di account
- [docs/codex-customization-gaps.md](docs/codex-customization-gaps.md): cosa Codex non personalizza senza codice
- [docs/adr/](docs/adr/): decisioni architetturali
