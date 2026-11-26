# Skill candidate (fase 2)

Data della ricerca: 2026-11-26. Solo ricerca: niente scaricato, niente installato.
Legenda: **V** = visto in una pagina o API GitHub letta; **U** = incerto (solo snippet o inferito).
Limite: i corpi di SKILL.md non sono stati letti. Qualità e contenuto sono **U** finché non si leggono. Script e hook sono giudicati dall'elenco dei file.

Regola d'adozione: si legge per intero la skill prima di copiarla, con fonte e licenza in `THIRD-PARTY-NOTICES.md`. Gli script si controllano prima dell'uso. Niente repo senza licenza.

## Esclusi
- `obra/superpowers`: hook di sessione (`hooks/`) e skill generaliste già coperte da `tdd`, `diagnosing-bugs` e `verification-loop`.
- `polars-inc/skills`: sovrapposta a `pandas-polars`.
- `vercel-labs/agent-skills`: nessuna licenza. Una skill recupera regole da un repo remoto a runtime: rischio supply chain.
- `langwatch/skills`, `pvnkmnk/AgenticSelfHostSkills`: nessuna licenza. Il secondo include file MCP.
- `Arize-ai/phoenix`: licenza NOASSERTION.
- `tmhsdigital/Home-Lab-Developer-Tools`: licenza poco chiara e server MCP.

## Area 1: AI dev / LLM

| # | Skill | Fonte | Licenza | Ultimo commit | Script / hook / MCP | Raccomandazione |
|---|---|---|---|---|---|---|
| 1 | `langfuse` (+ `migrate-to-langfuse`) | github.com/langfuse/skills | MIT (V) | 2026-11-26 | Nessuno in `skills/`; manifest di plugin e workflow nel repo (V) | **Adotta parzialmente**: solo skill e reference (instrumentation, evals, judge calibration, error analysis). Lega alla CLI di Langfuse (U). |
| 2 | `claude-api` | github.com/anthropics/skills | Apache-2.0 probabile (U) | 2026-11-16 | Nessuno (V) | **Adotta** se costruisci su API Claude. SKILL.md ~105 KB: costa contesto quando si attiva. |
| 3 | deepeval (`deepeval`, `deepeval-tracing`, `deepeval-otel`) | github.com/confident-ai/deepeval/tree/main/skills | Apache-2.0 (V) | 2026-11-26 | Non verificato (U) | **Adotta parzialmente, dopo lettura**: valutazione di app e agenti LLM, tracing. |
| 4 | Orchestra `15-rag`, `16-prompt-engineering`, `14-agents`, `17-observability` | github.com/Orchestra-Research/AI-Research-SKILLs | MIT (V) | 2026-10-11 | Non verificato per skill (U) | **Adotta a pezzi**: ~90 skill specifiche per librerie. Prendi solo quelle che usi. |
| 5 | `huggingface-community-evals` | github.com/huggingface/skills | Apache-2.0 (V) | 2026-11-26 | Ha `scripts/` ed `examples/` (V) | **Adotta parzialmente, previa revisione degli script**. |

## Area 2: ML engineering

| # | Skill | Fonte | Licenza | Ultimo commit | Script / hook / MCP | Raccomandazione |
|---|---|---|---|---|---|---|
| 1 | `huggingface-trackio` | github.com/huggingface/skills | Apache-2.0 (V) | 2026-11-26 | Solo SKILL.md e reference (V) | **Solo se usi Trackio**; altrimenti idee. Si sovrappone a `ml-experiment-hygiene`. |
| 2 | `huggingface-llm-trainer` (+ `trl-training`, `huggingface-vision-trainer`, `train-sentence-transformers`) | github.com/huggingface/skills | Apache-2.0 (V) | 2026-11-26 | 8 script Python (conversione GGUF, dataset inspector, stima costi, benchmark, esempi di training) (V). Probabilmente lancia HF Jobs a pagamento (U). | **Adotta a pezzi, solo per fine-tuning su HF, dopo audit degli script.** SKILL.md ~28 KB. |
| 3 | `huggingface-datasets` | github.com/huggingface/skills | Apache-2.0 (V) | 2026-11-26 | Solo SKILL.md (V) | **Adotta** se usi l'Hub HF; leggera e a basso rischio. |
| 4 | Orchestra `13-mlops` (mlflow, wandb, tensorboard, swanlab) e `12-inference-serving` (vllm, sglang, llama-cpp, tensorrt-llm) | github.com/Orchestra-Research/AI-Research-SKILLs | MIT (V) | 2026-10-11 | mlflow: SKILL.md e reference (V); altri non verificati (U) | **Adotta a pezzi**: uno tra mlflow o W&B, un serving coerente con il tuo stack. |

Gap: non trovata una skill con licenza per data validation (Pandera, Great Expectations) né per riproducibilità generale. Da valutare se `ml-experiment-hygiene` e `python-ml-tooling` la coprono già (U).

## Area 3: Siti web / frontend

| # | Skill | Fonte | Licenza | Ultimo commit | Script / hook / MCP | Raccomandazione |
|---|---|---|---|---|---|---|
| 1 | `accessibility`, `core-web-vitals`, `performance`, `best-practices`, `seo`, `web-quality-audit` | github.com/addyosmani/web-quality-skills | MIT (V) | 2026-08-24 | Uno script `analyze.sh` (V); manifest per Claude, Codex e Gemini | **Adotta a pezzi**: accessibilità, core web vitals e performance (reference WCAG, CLS/INP/LCP). Salta `analyze.sh` o leggilo prima. |
| 2 | `frontend-design` | github.com/anthropics/skills | Apache-2.0 (V) | 2026-11-16 | Nessuno (V) | **Adotta** così com'è: piccola (9 KB), design UI. |
| 3 | `webapp-testing` | github.com/anthropics/skills | Apache-2.0 probabile (U) | 2026-11-16 | `scripts/` ed `examples/` (V), probabile helper Playwright (U) | **Adotta a pezzi, dopo lettura degli script**. Si sovrappone in parte a `verification-loop`. |
| 4 | `web-artifacts-builder` | github.com/anthropics/skills | Probabile Apache-2.0 (U) | 2026-11-16 | Probabili script di build (U) | **Scarta, probabilmente**: pensata per gli artifact di claude.ai, non per siti generali (U). |

## Area 4: Homelab / configurazione

Area povera: poche fonti attive e con licenza.

| # | Skill | Fonte | Licenza | Ultimo commit | Script / hook / MCP | Raccomandazione |
|---|---|---|---|---|---|---|
| 1 | `docker-compose-patterns`, `docker-destructive-guardrails` (non `docker-build-strategies` né le skill MCP/sandbox) | github.com/docker/skills | Apache-2.0 (V) | 2026-11-25 | `verify-compose.sh` e `verify-build.sh` (V). Il repo ha `plugin-mcp.json` e una skill con config MCP (V). | **Adotta a pezzi**; controlla gli script `verify-*.sh`. Si sovrappone in parte a `docker-python`. |
| 2 | `using-sops` | github.com/jssblck/agents | **GPL-3.0** (V) | 2026-10-29 | Nessuno nella skill (V) | **Adotta solo questa**, copiandola e adattandola: licenza copyleft, repo di un singolo autore con 0 stelle (V). |
| 3 | `chezmoi-skill` | github.com/cosgroveb/chezmoi-skill | MIT (V) | 2026-01-27 | Nessuno (V); tool limitati a `Bash(chezmoi *)` (U) | **Adotta così com'è solo se usi chezmoi**; repo piccolo (3 stelle) e vecchio di 10 mesi: rileggila prima. |
| 4 | restic / borg (`l3digital-net/claude-code-plugins`) | github.com/l3digital-net/claude-code-plugins | MIT (V) | 2026-08-31 | Non verificato; è un repo di plugin, può avere hook o MCP (U) | **Adotta a pezzi, dopo revisione**: unica opzione di backup con licenza trovata. 8 stelle. |

Gap: nessuna skill con licenza e vetted per amministrazione Windows, sysadmin Linux o gestione dei segreti oltre a SOPS. Segnalati pacchetti di terzi per restic e Proxmox con avvisi di sicurezza (U): da evitare.

## Rischi da controllare prima dell'adozione
- Script da leggere: `huggingface-llm-trainer/scripts`, `huggingface-community-evals/scripts`, `webapp-testing/scripts`, `web-quality-audit/analyze.sh`, `docker verify-*.sh`.
- Config MCP: `docker/skills` (`plugin-mcp.json` e una skill con config MCP).
- Hook: nessuna candidata adottata ne ha.
