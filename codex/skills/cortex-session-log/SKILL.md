---
name: cortex-session-log
description: "Arricchisce la nota di sessione Cortex — consolida la narrativa (cosa fatto, decisioni, bug, feature) da spool + transcript nativo, aggiorna la nota Hot del progetto, estrae entità e preferenze. In modalità --auto (headless, lanciata da enrich-runner) niente domande e niente Todoist. Manuale: /cortex:session-log."
---

# Cortex — session-log

Leggi `skills/session-log/SKILL.md` nella root del plugin Cortex indicata da `CORTEX_PLUGIN_ROOT`.
Su questa macchina puoi ricavare la root anche dal marketplace locale `cortex-marketplace` in `claude/plugins.json` del repository dotagents o da `~/.claude/plugins/known_marketplaces.json`.
Segui la procedura originale con gli strumenti disponibili in Codex. Risolvi i file `bin/…` e `.cortex-data/…` dalla stessa root e tratta `CLAUDE_PLUGIN_ROOT` come riferimento a quella root.
Invoca le altre procedure come skill `cortex-*`. Usa solo gli MCP del profilo attivo. Se uno strumento o un dato richiesto manca, indica il passo bloccato.
Per una sessione Codex usa soltanto il riepilogo o transcript che l’utente ha fornito o individuato. Esegui a mano i soli passi per cui hai dati verificabili. Per riarricchire una sessione Claude già registrata puoi usare lo spool e il descrittore Claude indicati dalla fonte.
