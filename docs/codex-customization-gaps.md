# Codex vs Claude Code: cosa si personalizza senza codice (MAT-33)

Analisi del 2026-11-24 su Codex CLI 0.172.x. Fonti: documentazione ufficiale (`learn.chatgpt.com/docs/...`, ex `developers.openai.com/codex/...`) letta da un agent di ricerca, più verifiche locali con `codex features list`, `codex mcp list`, `codex execpolicy check`.
**[V]** letto sulla pagina ufficiale, **[S]** fonte secondaria o snippet, **[L]** verificato in locale (usato dove segnalato). Un'assenza non si legge su una pagina: le affermazioni "non esiste" sono marcate [S] (non trovato).
Ambito: solo configurazione nativa. Fork del TUI (`codex-rs`) e client su app-server/SDK sono fuori, vedi "Follow-up".

## Tabella dei gap

| Area | Claude Code (oggi nel repo) | Codex nativo | Gap | Si risolve con la config? |
|---|---|---|---|---|
| Tema: colori della UI | `claude/themes/cortex-dark.json` (override di `claude`, `promptBorder`, `success`, ...) | Nessun tema della UI nella documentazione [S] | Totale | No |
| Tema: syntax highlighting | non personalizzato da `cortex-dark.json` (eredita da `base: dark`) | `tui.theme` + file `.tmTheme` in `$CODEX_HOME/themes`, scelta con `/theme` [V]; 32 temi inclusi [S] | Solo codice e diff, non i colori della UI | Parziale: sì per il codice |
| Status line | `claude/statusline/cockpit.js`: comando esterno con JSON su stdin, una riga di testo libero (con `--subagent`, una JSON line per task) | `tui.status_line`: lista ordinata di item predefiniti, `/statusline` per scegliere e ordinare [V]. La lista completa degli id non è nella documentazione [S] | Niente comando esterno, niente testo custom | Parziale: solo item predefiniti |
| Titolo terminale | non usato | `tui.terminal_title` (`spinner`, `project`, ...) [V] | Nessuno | Sì |
| Notifiche | hook `terax-notify.js` (sequenza OSC 777 verso Terax) | `tui.notifications`, `tui.notification_method` (`auto`/`osc9`/`bel`), `tui.notification_condition` [V]; `notify = [cmd]` esterno con payload JSON [V] | OSC 777 non è tra i metodi: `osc9` o `bel`, oppure `notify` con uno script | Sì (con `notify` o `osc9`) |
| Hook | `PreToolUse`, `PostToolUse` (guard, ruff), `PermissionRequest`... | Stessi eventi principali + `SessionStart/End`, `Stop`, `Subagent*`, `Pre/PostCompact`, ... [V]; `hooks.json`, `[hooks]` inline, plugin [V] | `apply_patch` non espone `file_path` (non documentato) | Sì, con limiti (vedi MAT-35) [L: `guard.js` provato con payload di forma Codex] |
| Plugin | `claude/mods/` (jev-router: toast, slash command) | Un plugin porta skill, MCP, hook, app, asset [V]. Agent, comandi, temi e pannelli UI non risultano documentati [S] | Nessun equivalente dei mod con UI | No |
| Slash command custom | comandi del plugin | `~/.codex/prompts/*.md` deprecati [V], forse rimossi dalla 0.117/0.118 [S]; sostituti: skill, `tui.presets` (slot 0-9, `/presets`) [V] | Meno flessibile | Parziale: skill e preset |
| Tasti | nessuna configurazione tracciata nel repo | `tui.keymap.<contesto>.<azione>` e `/keymap` [V] | Nessuno | Sì |
| Pannelli / widget custom | nessuno (il mod `flightdeck` è stato rimosso) | Non documentati: "non supportato" salvo prova contraria nel codice [S] | Totale | No |

## Applicato in `codex/config.toml` (MAT-37)
- `tui.theme = "dracula"`: nome presente nell'elenco dei temi inclusi nel binario [L] (accanto a `catppuccin-mocha`, `gruvbox-dark`, `monokai-extended`, ...); cambia solo il syntax highlighting.
- `tui.status_line = [model-with-reasoning, current-dir, git-branch, context-used, five-hour-limit, weekly-limit]`: id letti dal binario installato [L].
  Elenco completo trovato: `model-with-reasoning`, `reasoning`, `current-dir`, `project-name`, `hostname`, `git-branch`, `pull-request-number`, `branch-changes`, `run-state`, `permissions`, `approval-mode`, `context-remaining`, `context-used`, `five-hour-limit`, `weekly-limit`, `codex-version`, `context-window-size`, `used-tokens`, `total-input-tokens`, `total-output-tokens`, `thread-credits`, `estimated-thread-cost`, ...
  Sostituisce solo in parte `cockpit.js` (niente testo libero né riga dei subagent).
- `tui.notifications = true` (metodo `auto`, condizione `unfocused`).
- `notify` **non** va nella base: la tua config locale lo punta già a un binario dell'app desktop, specifico della macchina.
- Non verificato in un TUI reale: l'effetto visivo (nessuna sessione interattiva avviata). La config si carica senza errori (`codex mcp list` con la base in un `CODEX_HOME` temporaneo).

## Cosa non si può ottenere senza codice
- Colori della UI personalizzati (il tema `cortex-dark` non ha equivalente).
- Status line con comando esterno (`cockpit.js`).
- Mod con pannelli e widget. `jev-router` (routing di modello ed effort, toast, comando `/jev-last`) non ha equivalente.

## Punti non verificati
- Gli id di `tui.status_line` sono stati letti dal binario (stringhe), non confermati da `/statusline` in un TUI aperto.
- Se i prompt custom funzionino ancora sulla 0.172.
- Se le skill siano invocabili per nome con slash o `$`.

## Follow-up (fuori ambito, solo se i gap contano)
1. Fork del TUI (`codex-rs`): massimo controllo (colori UI, status line custom), manutenzione alta a ogni aggiornamento upstream.
2. Client proprio su `codex app-server` o SDK, con i mod come plugin del client.
