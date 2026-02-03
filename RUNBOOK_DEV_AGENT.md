# RUNBOOK_DEV_AGENT.md — Dev Sub-Agent Workflow (Sonnet default, Opus escalation)

Goal: Ship code fast without “throwing parts”. Main agent handles strategy + diag; Dev agent executes contained coding tasks.

## Roles

### Main (this chat)
- Owns architecture decisions
- Runs RUNBOOK_DIAG.md before changes
- Defines acceptance criteria (Definition of Done)
- Breaks work into small tasks
- Reviews output + decides merge/deploy timing

### Dev sub-agent
- Implements code changes in-repo
- Runs builds/tests locally
- Writes/updates runbooks when relevant
- Produces a clean commit + verification steps

Default model: **Claude Sonnet**
Escalation model: **Claude Opus 4.5** for complex refactors / stuck debugging

## When Main should spawn Dev automatically (no permission needed)
Spawn Dev when:
- There is clear, bounded coding work ("add API route", "fix build", "wire UI")
- Investigation requires reading multiple files / making coordinated edits
- The task is >10 minutes of work or multi-step implementation

Main should NOT spawn Dev when:
- The user is asking for a quick explanation or decision
- It’s a sensitive external action (posting, emailing, deleting prod data)

When Dev is spawned, Main must say so explicitly in the reply:
- “I handed this to the Dev agent (Sonnet).”

## Task spec template (Main → Dev)
Use this exact structure:

1) **Goal** (1 sentence)
2) **Context** (links/files/paths)
3) **Constraints** (what not to change)
4) **Acceptance criteria** (bullet list)
5) **Implementation notes** (optional)
6) **Verification steps** (exact commands/URLs)
7) **Deliverables** (commit hash, env vars, notes)

## Dev output requirements
Dev must return:
- What changed (brief)
- Commit hash + branch
- Env vars/secrets required (names only; never paste secret values)
- How to test (3–5 steps)
- Known risks/rollback

## Escalation to Opus
Use Opus when:
- Protocol-level work (WS handshakes, crypto/auth)
- Difficult build/tooling conflicts
- Multiple interacting systems with unclear root cause

## Guardrails
- One problem per commit.
- No config/secrets changes without explicit instruction.
- Prefer reversible changes.
- Add/Update runbooks when we learn something.

