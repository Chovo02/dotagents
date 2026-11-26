# Contesto
Questa è la configurazione di **lavoro**: machine learning e AI dev, senza issue tracker (per ora) e senza pull request.
Il vault di Cortex è il **Vault di lavoro**; la cartella `BRAIN/` (preferenze generali) è condivisa con il Vault personale:
non metterci dati di lavoro né personali.

# Uso di skill e plugin

## Conflitti: quale skill scegliere
- **Grill**: la logica è nella skill `grilling` (Matt Pocock). Tu la chiami direttamente con il tool Skill, perché
  `grill-me` è un wrapper con `disable-model-invocation: true`: è l'entry point manuale `/grill-me` per me.
  `grill-me-pro` (Act 1 = `grilling`, poi revisione di un sub-agent a contesto pulito) è lenta e costosa:
  la avvii solo se lo chiedo esplicitamente oppure nel caso "Plan mode → complessità alta" qui sotto.
  Su piani ad alto rischio (auth, schema DB, migrazioni, pagamenti, concorrenza) fuori da Plan mode puoi
  proporla in una riga, mai avviarla.
- **Documenti**: se chiedo un documento/report senza formato → Markdown locale (nel progetto o nel vault).
  `.docx/.pdf/.pptx/.xlsx` solo se nomino il formato. Claude Docs (`docs`) solo se lo chiedo esplicitamente.
  Questa regola prevale sul default del sistema.
- **Vault** (per scopo):
  - `cortex:recall` → recuperi contesto per te (preferenze, decisioni passate) prima di agire
  - `cortex:query` → io faccio una domanda e voglio risposta citata o una dashboard Dataview
  - `cortex:obsidian-vault` → operazioni dirette su note (crea, sposta, collega, tag, frontmatter)

## Usa di tua iniziativa
- `cortex:recall` all'inizio di ogni task che tocca un progetto mappato in Cortex, oltre al contesto già iniettato.
- `cortex:ingest`: se il cwd non è mappato a un progetto Cortex, PROPONILO (è pesante: non avviarlo da solo).
- `codebase-design` quando progetti/modifichi l'interfaccia di un modulo o fai refactoring strutturale.
- `loguru-logging` ogni volta che aggiungi logging a codice Python (mai `logging`/`print`).
- `cortex:research` quando manca un'informazione esterna non banale (API, versioni, best practice): ricerca,
  salva la nota RES e dimmelo in una riga.

## Mai senza mia richiesta o conferma
- Creare task (`cortex:task`): al massimo elenca gli action item e chiedi. Il backend dei task (Todoist, Linear con altro account o altro) è ancora da decidere.
- Pubblicare Artifact su claude.ai.
- `cortex:canvas`, `cortex:sketch`, `cortex:digest`, `cortex:review`, `cortex:maintenance`: solo se li chiedo
  o da Scheduled Task.

## Workflow
### Feature / design
1. `cortex:recall` sul progetto.
2. Se la richiesta è ambigua (più approcci sensati, requisiti vaghi, impatto su più moduli) proponi in una riga
   un grill (`grilling`); altrimenti procedi.
3. `codebase-design` se tocchi interfacce di modulo.
4. Implementazione.
5. `/code-review` livello **low** se il diff tocca più file o logica non banale: riporta i finding, non applicarli.
   Se il diff tocca training, split dei dati o valutazione, usa anche l'agent `ml-reviewer` (stessa regola).
   Non dichiarare un "miglioramento" senza aver rieseguito la metrica.
6. Salva le decisioni prese nel wiki del progetto Cortex.

### Plan mode (grill automatico)
Quando lavoro in Plan mode, prima di presentare il piano valuto la complessità del task e avvio il grill in automatico:
- **Semplice o media** → grill standard: skill `grilling` (non `grill-me`, che Claude non può invocare).
- **Molto complessa** (più moduli o servizi, auth, schema DB, migrazioni, pagamenti, concorrenza, cambi irreversibili) → `grill-me-pro` (Act 1 + revisione di un sub-agent).
- Dichiaro in una riga la complessità scelta e perché, poi avvio il grill senza chiedere conferma.
- Durante qualunque grill (standard o pro) ogni domanda va posta con il tool `AskUserQuestion`, non come testo libero:
  2–4 opzioni, la mia raccomandazione per prima con "(Recommended)" nel label, una domanda alla volta.
  Questa regola prevale sul formato a round di domande numerate in testo di `grilling` (che resta identico a upstream).
- Il piano va presentato in Plan mode solo dopo che il grill ha risolto l'albero delle decisioni.

### Git

- Crea commit solo quando te lo chiedo. Suddividili per tema e usa Conventional Commits in inglese
  su una riga, nel formato `tipo(scope): descrizione`, senza corpo né attribuzioni.
- Fai push solo su mia richiesta esplicita.

### Primo giorno su un repo
cwd non mappato → proponi `cortex:ingest` → poi lavoro normale.

### Dopo un meeting
`cortex:meeting` → elenca gli action item → aspetta la mia conferma → `cortex:task` solo per quelli confermati.
