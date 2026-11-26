# MCP

Due configurazioni, due insiemi di server. I token non stanno mai nel repo: sono variabili d'ambiente.

## Vault Cortex
Cortex ha due parti: le *procedure* (skill e Plugin, versionate) e l'*accesso* al vault (il server MCP `obsidian`). Ci sono due vault Obsidian, ciascuno con il proprio plugin Local REST API e la propria porta. La cartella `BRAIN/` (preferenze generali) è condivisa tra i due tramite una directory junction di Windows.

| | Vault di lavoro (Claude) | Vault personale (Codex) |
|---|---|---|
| Endpoint MCP | `http://127.0.0.1:27223/mcp/` | `http://127.0.0.1:27123/mcp/` |
| Variabile del token | `OBSIDIAN_API_KEY_WORK` | `OBSIDIAN_API_KEY_PERSONAL` |
| Dove è dichiarato | `~/.claude.json` (non versionato): comando sotto | `codex/config.toml` |
| `CORTEX_PROFILE` | `work` | `personal` |

Comando per Claude (una tantum, per macchina):
```bash
claude mcp add --scope user --transport http obsidian http://127.0.0.1:27223/mcp/ \
  --header "Authorization: Bearer $OBSIDIAN_API_KEY_WORK"
```
Poi imposta `CORTEX_VAULT_PATH` e l'URL REST del Vault di lavoro nell'ambiente di Claude, e quelli del Vault personale nel blocco `[shell_environment_policy.set]` di Codex. Il file `cortex.config.json` del Plugin è unico e sta fuori dal repo (`Project/Tool/cortex`): se le variabili non bastano a indirizzarlo per agent, va diviso.

Junction per `BRAIN/` (esempio, la cartella vera sta nel Vault personale):
```powershell
New-Item -ItemType Junction -Path "<vault-lavoro>\BRAIN" -Target "<vault-personale>\BRAIN"
```
Nel `BRAIN/` solo preferenze generali: mai dati di lavoro o personali.

## Lavoro (Claude)
In `~/.claude.json`: `obsidian` (Vault di lavoro), `todoist` e `wispr-flow` (per `cortex:task` e `cortex:meeting`). Il backend dei task (Todoist, Linear con un altro account o altro) è una **decisione aperta**. Nessun issue tracker per ora.

## Personale (Codex)
In `codex/config.toml`: `linear` (issue, login con `codex mcp login linear`), `context7`, `excalidraw`, `obsidian` (Vault personale). Verifica con `codex mcp list`.

## Checklist manuale: connettori dell'account claude.ai
Non sono gestiti dal repo. Per il lavoro scollega quelli che non servono: Linear, JIRA, Atlassian MCP, Atlassian Rovo, Asana, monday.com, HubSpot, Intercom, Notion, Slack, Lucid, Box, Canva, Figma, Gmail, Google Calendar, Drive, Docs, Sheets, Slides. Scollega anche le skill sincronizzate dall'account (`sigext`, `docx`, `pdf`, `pptx`, `xlsx`, `google-workspace`, `docs`, `morning`, `import-memory`, `skill-creator`, `grill-me`, `loguru-logging`): altrimenti la cartella `claude/skills/synced/` si ricrea.
