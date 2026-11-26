# Installer

`install.mjs` (Node, Windows/Linux/macOS) collega i file e le cartelle del repo a `~/.claude` e alla home di Codex. Perché collega cartelle intere e tiene i backup nel repo: [ADR 0002](adr/0002-cartelle-linkate-e-backup-nel-repo.md).

## Nuova macchina
```bash
git clone <url> && cd dotagents
node install.mjs plan     # cosa cambierebbe (non modifica nulla)
node install.mjs apply    # applica; chiede conferma solo se sostituisce o rimuove qualcosa
```
- `plan` (default) mostra per sezione (Claude, Codex, vecchi link) cosa è già a posto, cosa verrebbe creato (`+`), sostituito (`~`) o rimosso (`-`). `--verbose` elenca anche le voci già a posto.
- `apply` è idempotente. Gli originali sostituiti o rimossi vengono **spostati** in `backup/<data>/<claude|codex>/` (nel repo, in `.gitignore`). Se non cambia nulla non crea nessun backup.
- `restore [data]` rimuove i link e rimette il backup indicato (default: l'ultimo).
- Flag: `--yes`, `--dry-run` (con `apply`/`restore`: solo il piano), `--verbose`, `--plugins`, `--codex-only`. Variabili: `CLAUDE_CONFIG_DIR`, `CODEX_HOME`.

Su Windows, quando i symlink non sono disponibili, l'installer usa junction per le directory e hard link per i file sullo stesso volume. Dopo un checkout che sostituisce i file, rilancia l'installer per riallacciare eventuali hard link.

## Cosa è tracciato (`claude/`)
`CLAUDE.md`, `settings.<os>.json` (symlinkato come `settings.json`), `agents/`, `hooks/`, `statusline/`, `themes/`, `chrome/` (solo Windows), `skills/` (cartella collegata per intero), `plugins.json` (marketplace + plugin abilitati, installabili con `--plugins`), `mods/` ([ADR 0003](adr/0003-mod-versionati-in-tree.md)).

## Cosa NON è tracciato
Credenziali (anche `~/.codex/auth.json`), `~/.claude.json`, history, sessioni, `projects/`, `plugins/` (cache), backup, file-history: runtime o segreti (vedi `.gitignore`). `~/.codex/hooks.json` non è tracciato: contiene path locali ed è gestito da altri tool.

## Skill
- Non esiste `skills/` alla radice: `~/.claude/skills` → `claude/skills`, `~/.codex/skills` → `codex/skills`. Ciò che era già installato (anche `.system`; le skill di account `synced` vanno scollegate dall'account Claude) finisce in `backup/<data>/`. `claude/skills/synced` e `codex/skills/.system` sono runtime locale e stanno in `.gitignore`.
- Gli installer rimuovono anche i vecchi link per-skill in `~/.agents/skills`, così Codex non vede duplicati.
- Le skill condivise sono oggi copie identiche in `claude/skills/` e `codex/skills/` (legacy, [ADR 0001](adr/0001-divisione-lavoro-personale.md)).
- Le skill sincronizzate da claude.ai (`docs`, `pdf`, ...) non sono esposte a Codex.

## Note per OS
- `settings.linux/macos.json` derivano da quello Windows senza gli hook `coucou-hook.exe` e senza `CLAUDE_CODE_PLUGIN_DIRS` / marketplace `cortex` (path locali Windows): da impostare a mano per macchina.
- I marketplace di tipo `directory` in `plugins.json` vengono saltati dallo script.

## Aggiungere una config
Metti il file in `claude/` (o `codex/`) e aggiungi una riga `link` (o `seed`) in `buildEntries()` di `install.mjs`.
