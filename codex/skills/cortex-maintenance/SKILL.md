---
name: cortex-maintenance
description: "Manutenzione completa di Cortex in un'unica passata — lint del vault (frontmatter, uid, naming, link rotti, orfani), dedup e relazioni del grafo Entità, probe delle capability MCP (Obsidian, Todoist, Wispr Flow, Excalidraw, Context7) e verifica dei redirect MEMORY.md. Usala periodicamente o quando qualcosa sembra fuori posto."
---

# Cortex — maintenance

Leggi `skills/maintenance/SKILL.md` nella root del plugin Cortex indicata da `CORTEX_PLUGIN_ROOT`.
Su questa macchina puoi ricavare la root anche dal marketplace locale `cortex-marketplace` in `claude/plugins.json` del repository dotagents o da `~/.claude/plugins/known_marketplaces.json`.
Segui la procedura originale con gli strumenti disponibili in Codex. Risolvi i file `bin/…` e `.cortex-data/…` dalla stessa root e tratta `CLAUDE_PLUGIN_ROOT` come riferimento a quella root.
Invoca le altre procedure come skill `cortex-*`. Usa solo gli MCP del profilo attivo. Se uno strumento o un dato richiesto manca, indica il passo bloccato.
Esegui i probe con gli MCP del profilo attivo. Per report di capability o redirect locali, applica gli scope e i prerequisiti della skill originale.
