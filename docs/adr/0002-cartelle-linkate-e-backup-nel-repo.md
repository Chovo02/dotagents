---
status: accepted
date: 2026-11-26
---
# Cartelle linkate per intero e backup nel repo

`install.mjs` collega intere cartelle (`~/.claude/skills` → `claude/skills`, `~/.codex/skills` → `codex/skills`) invece di una skill alla volta, e sposta ciò che sostituisce in `backup/<data>/` dentro il repo (in `.gitignore`) invece di lasciare file `.bak-*` in `~/.claude` e `~/.codex`. Su Windows, senza symlink, usa junction per le cartelle e hard link per i file sullo stesso volume.

## Considered Options

- **Link per singola skill**: lascia coesistere skill locali e del repo, ma richiede di mantenere un elenco e lascia duplicati (Codex vedeva anche `~/.agents/skills`).
- **Backup accanto all'originale**: nessuna cartella nel repo, ma sporca le home e rende il ripristino manuale.

## Consequences

- Qualsiasi cosa già installata nella cartella (anche `synced`, `.system`) finisce in `backup/` e non persiste; `claude/skills/synced` e `codex/skills/.system` sono runtime e restano in `.gitignore`.
- `restore [data]` è il percorso di ritorno; senza modifiche non viene creato nessun backup.
- Dopo un checkout che sostituisce i file serve rilanciare l'installer per riallacciare gli hard link.
