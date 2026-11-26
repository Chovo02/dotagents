---
name: grill-me-pro
description: Interview the user one question at a time, then have a fresh-context read-only sub-agent review the agreed implementation plan. Use on explicit request or for a highly complex plan in Plan mode, as directed by AGENTS.md.
---

# Grill, then review the plan

1. Read and follow `grilling`, using the one-question-at-a-time format in `AGENTS.md`. Resolve the decision tree with the user.
2. Write the agreed `PLAN.md` with the goal, approach, decisions and tradeoffs, risks or open questions, and scope. Start `PLAN-REVIEW-LOG.md` with the selected round limit. Default to five rounds unless the user specifies another positive limit.
3. Spawn a sub-agent with a clean context and read-only access (`code-reviewer` or an equivalent read-only agent) and send it only the plan path and this brief: be an adversarial reviewer; find concrete flaws (security, races, edge cases, schema conflicts, wrong assumptions, simpler alternatives) with one-line fixes; modify nothing; end with exactly `VERDICT: APPROVED` or `VERDICT: REVISE`. Send no secrets and no grill transcript. For later rounds, send the revised plan to the same sub-agent. If no valid verdict comes back, report the blocker.
4. Append each critique to the log. On `REVISE`, document what you changed or rejected and why, then re-submit. Stop at `APPROVED` or the round limit.
5. Present the plan, the review log, the round count and any unresolved disagreement; note that the reviewer shares the model family, so blind spots may be correlated. Ask for the user's sign-off before implementing.
