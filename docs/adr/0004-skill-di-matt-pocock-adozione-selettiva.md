---
status: accepted
date: 2026-11-26
---
# Adozione selettiva delle skill di Matt Pocock

Si adottano solo le skill di `mattpocock/skills` (MIT, commit `d653911`, con notice nella skill) che non confliggono con le regole personali in `CLAUDE.md` e non dipendono dal tracker di issue. Le altre sono state valutate e scartate.

- **Adottate:** `domain-modeling`, `grill-with-docs`, `handoff`, `wait-what`, `to-questionnaire`, `prototype`, più `grilling`, `grill-me`, `diagnosing-bugs`, `tdd`.
- **Scartate:** `pr` (in conflitto con corpo PR in italiano e `Linear: MAT-N`), `research` (duplica l'agent `researcher`), `to-spec`, `to-tickets`, `code-review`, `wayfinder`, `triage`, `implement-spec` (dipendono da `setup-matt-pocock-skills`), `implement` (dipende dal tracker), `retro` (CLAUDE.md, Skill tool), `writing-for-agents` (c'è già `writing-great-skills`).

## Consequences

- Una nuova skill di Pocock va confrontata con questa lista prima di entrare nel repo.
- Le skill adottate sono pinnate a un commit: l'aggiornamento è una scelta esplicita.
- Poteto (Lauren Tan): nessuna adottata; da rivalutare `review`, `plan`, `how`. Altre fonti segnalate e non adottate: `obra/superpowers`, `anthropics/skills`.
