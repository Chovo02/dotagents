---
status: accepted
date: 2026-11-26
---
# Potatura per ruolo: il dominio condiviso resta in entrambe

Dopo la fine della parità ([ADR 0001](0001-divisione-lavoro-personale.md)) le due configurazioni sono state potate. Il criterio: una capacità resta dove serve; il **dominio condiviso** (design, qualità, debug, ML, sicurezza, docker, logging) resta in entrambe come copie che possono divergere, e si tolgono solo le cose legate a un solo ruolo. Il lavoro è ML e AI dev, senza issue tracker né pull request; il personale è siti, ML, AI, homelab e configurazioni, con Linear per le issue.

## Considered Options

- **Ogni capacità in una sola configurazione**: nessuna duplicazione, ma i progetti personali di ML dovrebbero passare dallo strumento di lavoro.
- **Minimo per ruolo**: si tiene solo ciò che si usa di recente; rimuove skill generali che poi servono.

## Consequences

- Solo personale: `pr-reviewer`, `changelog-release-notes`, `writing-great-skills`, Linear. Solo lavoro: `to-questionnaire`, `cortex:meeting`, `cortex:task`, Todoist e Wispr Flow.
- Eliminati ovunque: `teach`, `flightdeck`, `humanizer`, il marketplace `claude-plugins-official`, le skill sincronizzate dall'account e i connettori MCP mai attivati.
- `grill-me-pro` fa rivedere il piano a un sub-agent a contesto pulito della stessa configurazione: nessuna dipendenza tra i due agent. Modello e famiglia coincidono, quindi gli errori possono essere correlati.
- `loguru-logging` è copiata nel repo per entrambe (licenza non verificata) perché la skill di account esce.
- Cortex ha due vault con porte diverse (lavoro 27223, personale 27123). `BRAIN/` è condivisa con una junction; il Plugin ha un solo `cortex.config.json` fuori dal repo, da indirizzare per agent con variabili d'ambiente.
- Codex ha un solo contesto: il profilo `work` è eliminato e `personal` è fuso in `config.toml`.
- Il backend dei task nel lavoro (Todoist, Linear con altro account o altro) resta una decisione aperta.
