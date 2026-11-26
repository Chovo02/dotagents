---
name: cortex-recall
description: "Recupera memoria profonda dal vault Obsidian su richiesta — preferenze, entità, sessioni passate, decisioni, meeting, ricerche. Usala quando serve cercare nel second brain qualcosa che non è già nel contesto iniettato all'avvio."
---

# Cortex — recall

Leggi `skills/recall/SKILL.md` nella root del plugin Cortex indicata da `CORTEX_PLUGIN_ROOT`.
Su questa macchina puoi ricavare la root anche dal marketplace locale `cortex-marketplace` in `claude/plugins.json` del repository dotagents o da `~/.claude/plugins/known_marketplaces.json`.
Segui la procedura originale con gli strumenti disponibili in Codex. Risolvi i file `bin/…` e `.cortex-data/…` dalla stessa root e tratta `CLAUDE_PLUGIN_ROOT` come riferimento a quella root.
Invoca le altre procedure come skill `cortex-*`. Usa solo gli MCP del profilo attivo. Se uno strumento o un dato richiesto manca, indica il passo bloccato.
Verifica la mappatura del cwd nel progetto Cortex prima di cercare. Se non è mappato, proponi cortex-ingest.
