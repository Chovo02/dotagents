---
name: cortex-ingest
description: "Acquisisce un nuovo progetto/repo nel second brain — analizza il codice in profondità e crea la cartella progetto con PREFIX · Home, una spina dorsale di note standard (overview, mappa repo, architettura, setup, env, glossario, domande aperte, rischi, convenzioni) PIÙ note di dettaglio adattive sulle parti fondamentali del repo, estrae entità, genera un canvas e registra la mappatura cwd→progetto. Usala la prima volta che lavori su un repo."
---

# Cortex — ingest

Leggi `skills/ingest/SKILL.md` nella root del plugin Cortex indicata da `CORTEX_PLUGIN_ROOT`.
Su questa macchina puoi ricavare la root anche dal marketplace locale `cortex-marketplace` in `claude/plugins.json` del repository dotagents o da `~/.claude/plugins/known_marketplaces.json`.
Segui la procedura originale con gli strumenti disponibili in Codex. Risolvi i file `bin/…` e `.cortex-data/…` dalla stessa root e tratta `CLAUDE_PLUGIN_ROOT` come riferimento a quella root.
Invoca le altre procedure come skill `cortex-*`. Usa solo gli MCP del profilo attivo. Se uno strumento o un dato richiesto manca, indica il passo bloccato.
Verifica che gli script Cortex puntino allo stesso vault dell’MCP attivo prima di registrare il progetto.
