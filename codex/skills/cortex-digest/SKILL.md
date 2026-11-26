---
name: cortex-digest
description: "Genera un rollup periodico (giornaliero/settimanale) nella Periodic Note — aggrega sessioni, meeting, task completati ed entità aggiornate del periodo in un riassunto leggibile. Usala a fine giornata/settimana o via Scheduled Task."
---

# Cortex — digest

Leggi `skills/digest/SKILL.md` nella root del plugin Cortex indicata da `CORTEX_PLUGIN_ROOT`.
Su questa macchina puoi ricavare la root anche dal marketplace locale `cortex-marketplace` in `claude/plugins.json` del repository dotagents o da `~/.claude/plugins/known_marketplaces.json`.
Segui la procedura originale con gli strumenti disponibili in Codex. Risolvi i file `bin/…` e `.cortex-data/…` dalla stessa root e tratta `CLAUDE_PLUGIN_ROOT` come riferimento a quella root.
Invoca le altre procedure come skill `cortex-*`. Usa solo gli MCP del profilo attivo. Se uno strumento o un dato richiesto manca, indica il passo bloccato.
