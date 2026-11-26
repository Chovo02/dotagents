# dotagents

Repo personale che versiona la configurazione degli agent di codice: Claude Code per il lavoro, Codex per i progetti personali. Il glossario fissa il vocabolario usato in README, `docs/` e ADR.

## Configurazioni

**Configurazione di lavoro**:
La configurazione di Claude Code (`claude/`): lo strumento che usi per il lavoro.
_Avoid_: config Claude (quando intendi il ruolo), fonte

**Configurazione personale**:
La configurazione di Codex (`codex/`): lo strumento che usi per i progetti personali.
_Avoid_: config Codex (quando intendi il ruolo), derivato

**Parità**:
La fase iniziale in cui le due configurazioni venivano tenute allineate (sync da Claude a Codex, copie identiche). È finita e il meccanismo è stato eliminato.
_Avoid_: sincronizzazione (come stato desiderato)

**Collegato / copiato**:
Un file è _collegato_ quando l'installer crea un link verso il repo (modifiche immediate in entrambe le direzioni); è _copiato_ (seed) quando viene copiato una sola volta e poi appartiene alla macchina.
_Avoid_: installato (ambiguo)

**Backup**:
Copia in `backup/<data>/` di ciò che l'installer ha sostituito o rimosso. Appartiene al repo ma non è versionata.
_Avoid_: `.bak`

## Capacità dell'agent

**Skill**:
Procedura riutilizzabile che l'agent carica quando il compito la richiede o quando la invochi per nome.
_Avoid_: comando, prompt

**Skill condivisa**:
Skill di dominio presente in entrambe le configurazioni (es. ML, debug, sicurezza) come copie indipendenti che possono divergere. Una skill legata a un solo ruolo sta in una sola configurazione.
_Avoid_: skill comune, copia identica

**Agent**:
Sotto-agente con contesto proprio, tool limitati e un compito stretto, delegato dall'agent principale. Una skill guida l'agent principale; un Agent lavora in parallelo e restituisce solo il risultato.
_Avoid_: subagent, bot, skill

**Revisore**:
Agent in sola lettura che rilegge lavoro già fatto e segnala solo problemi certi, con scenario di fallimento.
_Avoid_: reviewer generico, linter

**Hook**:
Script che l'agent esegue automaticamente a un evento (prima o dopo un tool, a fine turno).
_Avoid_: trigger, automazione

**Guard**:
Hook `guard.js` che blocca comandi shell pericolosi. Sorgente unica in `claude/hooks/`, linkata anche da Codex.
_Avoid_: firewall

**Mod**:
Estensione dell'interfaccia di Claude Code (pannelli, band, routing del modello). Esiste solo per Claude.
_Avoid_: plugin

**Plugin**:
Pacchetto distribuito da un marketplace che porta skill, hook o MCP (es. `cortex`). Un Mod cambia l'interfaccia; un Plugin aggiunge capacità.
_Avoid_: mod, estensione

## Conoscenza personale

**Cortex**:
Il second brain: plugin e skill che leggono e scrivono il vault. In Claude è un Plugin; in Codex sono 11 skill `cortex-*` (senza `meeting` e `task`, solo del lavoro) che rimandano ai file del Plugin.
_Avoid_: memoria, notes

**Vault**:
Un vault Obsidian che Cortex usa come memoria persistente. Ce ne sono due, separati: il **Vault di lavoro** (usato dalla configurazione di lavoro) e il **Vault personale** (usato dalla configurazione personale). Condividono solo la cartella BRAIN.
_Avoid_: cartella note

**BRAIN**:
La cartella `BRAIN/` del vault (preferenze generali e Home), condivisa tra Vault di lavoro e Vault personale tramite una junction. Non contiene dati di lavoro né personali.
_Avoid_: memoria
