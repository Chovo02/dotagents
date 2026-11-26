---
name: cortex-sketch
description: "Crea diagrammi/schizzi freeform con Excalidraw via MCP — whiteboard, bozze, disegni a mano libera che NON devono linkare note. Per mappe di note cliccabili usa /canvas (Canvas nativo)."
---

# Cortex — sketch

Leggi `skills/sketch/SKILL.md` nella root del plugin Cortex indicata da `CORTEX_PLUGIN_ROOT`.
Su questa macchina puoi ricavare la root anche dal marketplace locale `cortex-marketplace` in `claude/plugins.json` del repository dotagents o da `~/.claude/plugins/known_marketplaces.json`.
Segui la procedura originale con gli strumenti disponibili in Codex. Risolvi i file `bin/…` e `.cortex-data/…` dalla stessa root e tratta `CLAUDE_PLUGIN_ROOT` come riferimento a quella root.
Invoca le altre procedure come skill `cortex-*`. Usa solo gli MCP del profilo attivo. Se uno strumento o un dato richiesto manca, indica il passo bloccato.
