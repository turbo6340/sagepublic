# RUNBOOK_DIAG.md — “No more throwing parts”

Purpose: A repeatable diagnostic loop so we fix the *right* thing fast.

## The Diagnostic Loop (always)

### 0) Freeze the situation (30 seconds)
- Stop changing settings while we diagnose.
- Capture a screenshot/error string.

### 1) Define the problem precisely (1 minute)
Write **two sentences**:
- **Observed:** what is happening (exact error text, where it appears).
- **Expected:** what should happen.

### 2) Reproduce once + capture evidence (1–2 minutes)
Capture one of:
- build log snippet
- runtime log snippet
- browser console error
- exact URL + HTTP status

### 3) Classify the failure (choose one)
Pick the bucket before touching anything:
- **Build**: `npm run build` fails.
- **Deploy**: build succeeds locally but Fly runs different commit/dir.
- **Runtime/Env**: missing/mismatched secrets, wrong URLs, sleeping machines.
- **Auth**: OAuth redirect mismatch, session loop, allowlist block.
- **Product wiring**: UI is a stub; no API call exists.
- **Network**: gateway not reachable, TLS/WS blocked.

### 4) Whole-picture “Top 5 checks” (2–5 minutes)
Run the checks for your bucket (below). Only then change something.

### 5) Make one change with a hypothesis
- **Hypothesis:** “If we change X, symptom Y will change to Z.”
- Apply change.

### 6) Verify using the same repro steps
- If fixed: stop.
- If not: revert or move to next hypothesis.

---

## Build checks (Next.js)
From repo root:
```bash
npm ci
npm run build
```
If it fails, fix locally first. Do **not** adjust Fly/DNS until this passes.

---

## Deploy checks (Fly)
Goal: confirm Fly is building the right repo/branch/path and running the right commit.

In Fly dashboard:
- Confirm **Deploy branch** = `main`
- Confirm **Working Directory** and **Config path** are correct for your repo layout
- Confirm latest deployment shows the expected commit hash

If you’re unsure:
- Trigger a deploy and inspect build logs for:
  - Dockerfile path
  - context size
  - the commit hash/branch being checked out

---

## Runtime/Env checks
Common symptom: “works locally / in one browser, fails in prod”, missing buttons, token mismatch.

Checklist:
- Are required env vars present?
- Are they in the right place?
  - **server runtime** vs **client build-time** (`NEXT_PUBLIC_*`)
- Did we redeploy after env change?

Rule:
- Prefer server runtime env (route handlers) over `NEXT_PUBLIC_*` for anything critical.

Fly actions:
- After editing secrets, use **Deploy Secrets** (if present) and/or **Deploy app**.

---

## Auth checks (NextAuth + Google)
Common symptom: redirect loop or `redirect_uri_mismatch`.

Confirm in Google OAuth client:
- Authorized JS origins:
  - `https://app.artificialexpert.ai`
- Authorized redirect URIs:
  - `https://app.artificialexpert.ai/api/auth/callback/google`

Confirm in Fly secrets:
- `NEXTAUTH_URL=https://app.artificialexpert.ai`
- `NEXTAUTH_SECRET=<random>`
- `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`
- Optional allowlist: `ALLOWED_EMAILS=...`

---

## Network checks (Gateway reachability)
Common symptom: WS connect fails, timeouts, 1008 errors.

Checklist:
- Is the gateway reachable from where the request is coming from?
  - If Fly is calling it, it must be publicly reachable (or via a network path Fly can access).
- Are you using the correct scheme?
  - `wss://` for secure WebSocket

---

## Product wiring checks
Common symptom: “page loads but shows nothing / placeholder forever”.

Checklist:
- Does the UI actually call an API?
- Does the API exist and return data?
- Are we blocking on a missing backend?

Rule:
- If a page is not wired, it must say so explicitly and offer the shortest working path.

---

## Standard “First Question” when stuck
Send exactly:
1) Screenshot of the error
2) The URL you’re on
3) Whether it reproduces in a private window

---

## Preventive guardrails (recommended)
- Add CI to require `npm run build` on every PR/push
- Record “Definition of Done” before starting changes
- Avoid multi-variable changes: 1 change → 1 verification

