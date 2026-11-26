---
status: accepted
date: 2026-11-26
---
# Mod versionati direttamente nel repo

`claude/mods/jev-router` è un file normale del repo, non un repo annidato né un submodule. Si carica in-place con `CLAUDE_CODE_PLUGIN_DIRS`. Il mod `flightdeck` (fork locale) è stato rimosso il 2026-11-26 ([ADR 0005](0005-potatura-per-ruolo.md)). La directory `data/` è esclusa.

## Considered Options

- **Submodule o repo annidato**: tiene la storia upstream ma complica clone su nuova macchina e le modifiche locali.
- **Solo marketplace**: nessun fork; però il fork differisce dall'upstream in `plugin.json`, `hooks/core.ts`, `hooks/register.tsx` e nei test.

## Consequences

- Gli aggiornamenti upstream vanno riportati a mano.
- I mod sono solo per Claude Code; Codex non ha un equivalente (vedi `docs/codex-customization-gaps.md`).
