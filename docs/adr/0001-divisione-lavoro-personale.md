---
status: accepted
date: 2026-11-26
---
# Claude per il lavoro, Codex per i progetti personali

Claude Code e Codex erano tenuti allineati (Claude come sorgente, Codex derivato con `codex/sync-claude.cjs`) solo per pareggiare le due configurazioni. Quella fase è superata: `claude/` è la configurazione di lavoro e `codex/` quella personale, e possono divergere.

## Consequences

- `codex/sync-claude.cjs`, `codex/AGENTS.md` e `codex/agents/*.toml` generati da Claude, e la regola "skill condivise = copie identiche", sono **legacy da dismettere**. Non sono ancora rimossi: restano finché i contenuti non si separano.
- Il profilo Codex `work` è un residuo della parità; a regime Codex avrà solo il contesto personale.
- I documenti descrivono le due configurazioni come distinte; il README non dice più che Claude è "la fonte".
- Follow-up **chiuso** il 2026-11-26: sync, intestazione generata, regola delle copie identiche e profilo `work` sono stati eliminati ([ADR 0005](0005-potatura-per-ruolo.md)).
