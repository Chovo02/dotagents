# Contesto
Questa è la configurazione **personale**: siti, machine learning, AI, homelab e gestione delle mie configurazioni.
Le issue stanno su Linear (MCP `linear`). Il vault di Cortex è il **Vault personale**; la cartella `BRAIN/`
(preferenze generali) è condivisa con il Vault di lavoro: non metterci dati personali né di lavoro.

# Uso di skill e plugin

In Codex apri lo `SKILL.md` della skill citata e segui le sue istruzioni. Per il vault usa solo il server
`obsidian` configurato. Se manca una skill o un MCP richiesto, segnalalo e continua con le attività indipendenti.

## Conflitti: quale skill scegliere
- **Grill**: la logica è nella skill `grilling` (Matt Pocock). Tu la chiami direttamente leggendo il suo `SKILL.md`, perché
  `grill-me` è un wrapper a invocazione esplicita: è l'entry point manuale `$grill-me` per me.
  `grill-me-pro` (Act 1 = `grilling`, poi revisione di un sub-agent a contesto pulito) è lenta e costosa:
  la avvii solo se lo chiedo esplicitamente oppure nel caso "Plan mode → complessità alta" qui sotto.
  Su piani ad alto rischio (auth, schema DB, migrazioni, pagamenti, concorrenza) fuori da Plan mode puoi
  proporla in una riga, mai avviarla.
- **Documenti**: se chiedo un documento/report senza formato → Markdown locale (nel progetto o nel vault).
  `.docx/.pdf/.pptx/.xlsx` solo se nomino il formato. Pagine condivise su servizi esterni solo se lo chiedo.
- **Vault** (per scopo):
  - `cortex-recall` → recuperi contesto per te (preferenze, decisioni passate) prima di agire
  - `cortex-query` → io faccio una domanda e voglio risposta citata o una dashboard Dataview
  - `cortex-obsidian-vault` → operazioni dirette su note (crea, sposta, collega, tag, frontmatter)

## Usa di tua iniziativa
- `cortex-recall` all'inizio di ogni task che tocca un progetto mappato in Cortex.
- `cortex-ingest`: se il cwd non è mappato a un progetto Cortex, PROPONILO (è pesante: non avviarlo da solo).
- `codebase-design` quando progetti/modifichi l'interfaccia di un modulo o fai refactoring strutturale.
- `loguru-logging` ogni volta che aggiungi logging a codice Python (mai `logging`/`print`).
- `cortex-research` quando manca un'informazione esterna non banale (API, versioni, best practice): ricerca,
  salva la nota RES e dimmelo in una riga.

## Mai senza mia richiesta o conferma
- Pubblicare documenti o pagine condivise su servizi esterni.
- Creare o modificare issue su Linear: al massimo proponile e chiedi.
- `cortex-canvas`, `cortex-sketch`, `cortex-digest`, `cortex-review`, `cortex-maintenance`: solo se li chiedo
  o da attività pianificata.

## Workflow
### Feature / design
1. `cortex-recall` sul progetto.
2. Se la richiesta è ambigua (più approcci sensati, requisiti vaghi, impatto su più moduli) proponi in una riga
   un grill (`grilling`); altrimenti procedi.
3. `codebase-design` se tocchi interfacce di modulo.
4. Implementazione.
5. `code-reviewer` (se disponibile, altrimenti rivedi il diff direttamente) se il diff tocca più file o logica non banale: riporta i finding, non applicarli.
   Se il diff tocca training, split dei dati o valutazione, usa anche l'agent `ml-reviewer` (stessa regola).
   Non dichiarare un "miglioramento" senza aver rieseguito la metrica.
6. Salva le decisioni prese nel wiki del progetto Cortex.

### Plan mode (grill automatico)
Quando lavoro in Plan mode, prima di presentare il piano valuto la complessità del task e avvio il grill in automatico:
- **Semplice o media** → grill standard: skill `grilling` (non `grill-me`, riservata all'utente).
- **Molto complessa** (più moduli o servizi, auth, schema DB, migrazioni, pagamenti, concorrenza, cambi irreversibili) → `grill-me-pro`.
- Dichiaro in una riga la complessità scelta e perché, poi avvio il grill senza chiedere conferma.
- Durante qualunque grill (standard o pro) ogni domanda va posta con lo strumento di domande disponibile in Codex:
  2–3 opzioni, la mia raccomandazione per prima con "(Recommended)" nel label, una domanda alla volta.
  Se lo strumento è assente, mantieni lo stesso formato in chat.
  Questa regola prevale sul formato a round di domande numerate in testo di `grilling`.
- Il piano va presentato in Plan mode solo dopo che il grill ha risolto l'albero delle decisioni.

### Git e pull request

- Crea commit solo quando te lo chiedo. Suddividili per tema e usa Conventional Commits in inglese
  su una riga, nel formato `tipo(scope): descrizione`, senza corpo né attribuzioni.
- Fai push e apri pull request solo su mia richiesta esplicita. Per il merge serve una mia richiesta distinta.
- Dopo l'apertura, proponi la review con `pr-reviewer` se disponibile e avviala solo su mia conferma.
  Presenta i finding come bozza e pubblicali sulla PR solo con il mio ok esplicito.

### Primo giorno su un repo
cwd non mappato → proponi `cortex-ingest` → poi lavoro normale.
