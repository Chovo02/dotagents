---
name: grill-me-pro
description: Two-act plan hardening. Also invoked automatically from Plan mode when the task is very complex (multi-module, auth, schema, migrations, payments, concurrency). ACT 1 (you ↔ Claude) — Claude interviews you one question at a time, recommending an answer for each and exploring the codebase when it can answer itself, until every branch of the decision tree is resolved. ACT 2 (Claude ↔ fresh sub-agent) — Claude writes the locked plan to PLAN.md and a fresh-context read-only sub-agent of the same configuration attacks it adversarially (VERDICT:APPROVED/REVISE); Claude revises and re-submits to the SAME sub-agent until APPROVED or a MAX_ROUNDS cap, then you sign off before any code. Use when the user says "grill me then have it reviewed", "grill me and stress-test the plan", or is about to build something high-stakes (auth, schema, concurrency, migrations, payments). Act 1 calls Matt Pocock's `grilling` skill (MIT). NOT for reviewing already-written code (use /code-review) and NOT for trivial changes.
---

# Grill-Me-Pro — Get Grilled, Then Get Reviewed

- **Act 1 fixes building the wrong thing.** Claude interrogates *you* until intent is locked. (Runs Matt Pocock's `grilling` skill, MIT — see `../grilling/THIRD-PARTY-NOTICES.md`.)
- **Act 2 fixes a plan that sounds right but breaks.** A fresh-context sub-agent, same configuration, attacks the locked plan without having seen the grill. It never touches a file.

You enter at two points only: answering the grill, and signing off the converged plan.

---

## ACT 1 — GRILL (you ↔ Claude)

Call the Skill tool with `grilling` and run it on the plan or design at hand. Do not restate its instructions here.

Question format follows the user's global CLAUDE.md rule for grills: one question at a time, each asked with the `AskUserQuestion` tool (2–4 options, your recommended answer first with "(Recommended)" in its label), never as free text.

When the decision tree is resolved and we're aligned, **write the agreed plan to `PLAN.md`** in this structure, then move to Act 2:

```markdown
# Plan: <task>
_Locked via grill — by Claude + <user>_

## Goal
<one paragraph — reflects what the grilling actually settled>

## Approach
<numbered, concrete steps>

## Key decisions & tradeoffs
<the contestable choices the grill resolved — name them so Codex has something to bite>

## Risks / open questions
<anything still genuinely open>

## Out of scope
<bounds the grill established>
```

Initialize `PLAN-REVIEW-LOG.md`:
```markdown
# Plan Review Log: <task>
Act 1 (grill) complete — plan locked with the user. MAX_ROUNDS=<n>.
```

---

## ACT 2 — REVIEW (Claude ↔ fresh sub-agent)

Hand the locked plan to a sub-agent with a clean context.

### Tunables
| Var | Default | Meaning |
|-----|---------|---------|
| `MAX_ROUNDS` | `5` | Hard cap on review rounds. The loop ALWAYS terminates here. |
| `PLAN_FILE` | `PLAN.md` | The plan Act 1 produced. |
| `LOG_FILE` | `PLAN-REVIEW-LOG.md` | Append-only argument transcript. |

If invoked with e.g. `rounds=3`, use that for `MAX_ROUNDS`. Echo resolved values before starting.

### Round 1 — new sub-agent
Spawn it with the Agent tool, `subagent_type: "Plan"` (no Edit/Write tools, so it is read-only). Send only the prompt below plus the path of the plan, no secrets, no grill transcript:

> You are an adversarial reviewer for an implementation plan. Be skeptical and specific: find what breaks, not what is agreeable. Read the plan at `PLAN.md` and any repo files you need. Identify concrete flaws: security holes, race conditions, missing edge cases, schema conflicts, wrong assumptions, observability gaps, simpler alternatives. For each, give a one-line fix. Do NOT modify any files. End your reply with EXACTLY one line: `VERDICT: APPROVED` if the plan is sound enough to implement, or `VERDICT: REVISE` if it still has material problems.

### Rounds 2..MAX — same sub-agent
Continue the SAME sub-agent with SendMessage so it remembers its prior critiques: "I revised the plan. Re-review PLAN.md, check whether your prior findings are addressed and flag anything new. End with VERDICT: APPROVED or VERDICT: REVISE."

### Each round
1. Append `## Round <n> — reviewer` and the full critique to `LOG_FILE`.
2. Read the last line:
   - `VERDICT: APPROVED` → go to Resolution.
   - `VERDICT: REVISE` → decide what is worth acting on (you are final arbiter), revise `PLAN_FILE`, append `### Response` to `LOG_FILE` (what changed, what was rejected, why), next round.
   - No valid verdict → report the blocker; don't fake one.
3. If round > `MAX_ROUNDS` → Resolution (deadlock).

### Resolution (user sign-off)
- **APPROVED:** present the final plan, a 3-bullet summary of what the two acts improved, and the round count. Ask: *"Grilled + survived N rounds. Implement it now?"* Code only on yes.
- **Deadlock:** do NOT fake convergence. List each unresolved point with your counter-position and let the user decide.

---

## Hard rules
- Act 1 always precedes Act 2; don't write `PLAN.md` before the grill has resolved the decision tree.
- The reviewer is read-only every round.
- The loop ALWAYS terminates at `MAX_ROUNDS`.
- Incorporate good critiques, reject bad ones with a logged reason: don't cave to everything, don't ignore it.
- Code only after the user's final sign-off. `LOG_FILE` is the deliverable.
- Same model family means correlated blind spots: say so in the final summary if the reviewer found nothing.
