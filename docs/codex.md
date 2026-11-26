# Codex (`codex/`)

Configurazione personale (siti, ML, AI, homelab, configurazioni). Destinazione: `$CODEX_HOME` se impostata, altrimenti `~/.codex`. Ruolo: [ADR 0001](adr/0001-divisione-lavoro-personale.md) e [ADR 0005](adr/0005-potatura-per-ruolo.md). `AGENTS.md` e `agents/*.toml` sono file a mano, non più generati da Claude.

## Configurazione
- `config.toml` **non** è un symlink. Codex ci scrive il trust dei progetti (`[projects.*]`) e contiene path locali, quindi `codex/config.toml` è una base portabile **copiata solo se `~/.codex/config.toml` non esiste**. Un file esistente non viene mai toccato (nemmeno da `restore`): i cambi della base si riportano a mano.
- Gli agent sono collegati singolarmente. Codex eredita i permessi della sessione. Per una garanzia di sola lettura usa una sessione con sandbox `read-only`.
- MCP nella base: Linear, Context7, Excalidraw e `obsidian` (Vault personale). Mappa e prerequisiti: [mcp.md](mcp.md).
- **TUI**: la base imposta `tui.theme` (solo syntax highlighting), `tui.status_line` (item predefiniti) e `tui.notifications`. Cosa Codex non permette senza codice: [codex-customization-gaps.md](codex-customization-gaps.md). Su una macchina con `[tui]` già presente, unisci le chiavi a mano.

## Sicurezza e hook (`config.toml` base + `rules/`)
- `approval_policy = "on-request"` e `sandbox_mode = "workspace-write"` espliciti.
- Hook `PreToolUse` su `^Bash$` che esegue `guard.js`: stessa sorgente di Claude (`claude/hooks/guard.js`), linkata in `<codex>/hooks/guard.js`. Test: `node --test claude/hooks/guard.test.js`. Hook inline in `config.toml`, non in `hooks.json`; al primo avvio va rivisto con `/hooks`.
- `rules/dotagents.rules` (execpolicy, `forbidden`): `rm -rf`, `git push --force`, `git reset --hard`, `git clean -f`. Matching posizionale: `git push origin main --force` sfugge alla regola ma non all'hook. Test: `codex execpolicy check --rules codex/rules/dotagents.rules -- <cmd>` (18 casi provati con argv diretto). Il file ha un nome proprio per non toccare `~/.codex/rules/default.rules`.

**Limiti da conoscere**
- *Windows:* Codex lancia i comandi come `pwsh.exe -Command "<stringa>"`, quindi i prefissi di `dotagents.rules` potrebbero non combaciare mai; il test con `codex execpolicy check` non lo riproduce. Non verificato: la rete di sicurezza reale su Windows è l'hook.
- *Config già esistente:* il seed non la tocca, quindi hook e approval della base **non** arrivano, mentre `guard.js` e le regole vengono linkati lo stesso. Per attivare l'hook aggiungi `hooks = true` dentro il `[features]` esistente (un secondo `[features]` è un errore TOML) e copia i blocchi `[[hooks.PreToolUse]]` e `[[hooks.PreToolUse.hooks]]`. Su `approval_policy` e `sandbox_mode` vale il valore locale.
- *`CODEX_HOME` diverso da `~/.codex`:* il comando dell'hook punta a `$HOME/.codex/hooks/guard.js` (`%USERPROFILE%\.codex\hooks\guard.js` su Windows) mentre l'installer linka in `$CODEX_HOME/hooks`: va allineato a mano, altrimenti Node fallisce senza bloccare e l'hook risulta spento.
- *Regole:* il match è sui token esatti. Le forme con opzioni di git prima del sottocomando o con refspec `+branch` sfuggono alle regole e le prende solo l'hook (regex sull'intera riga).
- **Non portato:** `ruff-check.js` (PostToolUse su Write/Edit): in Codex le modifiche passano da `apply_patch` con `tool_input` non documentato. Per lo stesso motivo `guard.js` in Codex non controlla i path segreti di Read/Edit, solo i comandi shell.

## Cortex
Un solo contesto, nessun profilo: `config.toml` dichiara il server `obsidian` del Vault personale e `CORTEX_PROFILE = "personal"`. Il token sta in `OBSIDIAN_API_KEY_PERSONAL` e `CORTEX_VAULT_PATH` va impostato per macchina nel blocco `[shell_environment_policy.set]`, fuori dal repo.

- **Skill `cortex-*`:** 11 skill rimandano ai file originali del Plugin Cortex. Indica la root con `CORTEX_PLUGIN_ROOT` o usa il marketplace locale registrato da Claude. `cortex-session-log` è manuale. `meeting` e `task` non ci sono: sono solo del lavoro.
- **Vault condiviso solo in parte:** la cartella `BRAIN/` è una junction condivisa con il Vault di lavoro (vedi [mcp.md](mcp.md)); il resto dei due vault è separato.

## Solo Claude Code (non portato in Codex)
Resta in `claude/` e non ha un link in `~/.codex`. Dettaglio dei gap: [codex-customization-gaps.md](codex-customization-gaps.md).

| Cosa | Perché resta solo Claude | Equivalente in Codex |
|---|---|---|
| `mods/jev-router` | Instrada modello ed effort per turno con l'API dei mod | Modello e `model_reasoning_effort` a mano o per agent |
| `statusline/cockpit.js` | Comando esterno con JSON su stdin | `tui.status_line` con item predefiniti |
| `themes/cortex-dark.json` | Tema dei colori della UI | `tui.theme` (solo syntax highlighting) |
| `chrome/` | Native host di Claude in Chrome (solo Windows) | Nessuno |
| `plugins.json` | Marketplace e plugin di Claude Code (`cortex`) | Le skill `cortex-*` leggono le procedure dal marketplace locale |
| `settings.<os>.json` | Permessi, hook e variabili nel formato Claude Code | `config.toml` + `rules/` |
| `hooks/ruff-check.js` | Legge `tool_input.file_path` di Write/Edit | Nessuno finché non c'è un payload reale |
| `hooks/terax-notify.js` | Emette OSC 777 con il formato hook di Claude | `tui.notifications` o `notify` |
