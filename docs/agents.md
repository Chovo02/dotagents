# Catalogo degli agent

Cinque agent in `claude/agents/*.md` (lavoro) e sei in `codex/agents/*.toml` (personale), mantenuti a mano: `pr-reviewer` esiste solo in Codex perché il lavoro non usa pull request ([ADR 0005](adr/0005-potatura-per-ruolo.md)). Un agent ha contesto pulito, tool limitati e restituisce solo il risultato. Tutti sono in sola lettura sul codice, tranne `test-runner` che esegue comandi.

## Revisori in sola lettura
Segnalano solo problemi certi, con scenario di fallimento concreto.

| Agent | Cosa rivede | Modello / effort | Tool |
|---|---|---|---|
| `code-reviewer` | Diff o file: bug di correttezza e requisiti mancanti | sonnet / high | Read, Grep, Glob, Bash |
| `ml-reviewer` | Training, split, preprocessing, valutazione: errori che invalidano i risultati | sonnet / high | Read, Grep, Glob, Bash |
| `pr-reviewer` (solo Codex) | Pull Request (numero o URL), in italiano | sonnet / high | Read, Grep, Glob, Bash |

Regola in `AGENTS.md`: dopo l'apertura di una PR proponi `pr-reviewer` e avvialo solo su conferma; i finding sono una bozza da pubblicare solo con ok esplicito.

## Ricerca ed esplorazione
| Agent | Cosa fa | Modello / effort | Tool |
|---|---|---|---|
| `Explore` | Ricerca ampia su molti file; localizza, non giudica | haiku / low | Read, Grep, Glob, Bash |
| `researcher` | Ricerca web su API, versioni, best practice; ogni affermazione con URL e marcata verificata o incerta | sonnet / medium | WebSearch, WebFetch, Read, Grep, Glob |

## Esecuzione
| Agent | Cosa fa | Modello / effort | Tool |
|---|---|---|---|
| `test-runner` | Esegue la suite di test e riporta solo i fallimenti con `file:riga` e messaggio | haiku / low | Bash, Read, Grep, Glob |
