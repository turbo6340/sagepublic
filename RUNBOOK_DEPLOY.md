# RUNBOOK_DEPLOY.md — Artificial Expert (Fly + NextAuth + Clawdbot)

This runbook exists to prevent “circles”: build failures, env confusion, and unclear definition-of-done.

## Golden Rules

1) **Never debug prod before `next build` passes locally.**
2) **Separate problems into:**
   - Build (can it compile?)
   - Deploy (did Fly build the same thing you built?)
   - Runtime (does it run with env?)
   - Product (is the feature actually wired?)
3) **Prefer runtime config over build-time config** for URLs/secrets.
   - Avoid relying on `NEXT_PUBLIC_*` unless you control the build environment.
4) **One front door:** `https://app.artificialexpert.ai/` (Google allowlist).
5) **Have an escape hatch:** a working cockpit link (`/cockpit`) even if native pages aren’t wired.

---

## Definition of Done (DoD)

Before saying “it works”, confirm:

- **Deploy:** latest commit is running on Fly.
- **Auth:** Google login succeeds; logout then login succeeds.
- **Warm:** Fly machine stays up (no cold-start surprises).
- **Cockpit:** `GET /cockpit` redirects to the gateway UI.
- **Feature wiring:**
  - If Chat/Status/Costs are placeholders, they must say so explicitly.

---

## Preflight Checklist (5 minutes)

### A) Local build
From repo root (`artificialexpert-app/`):

```bash
npm ci
npm run build
```

If this fails: fix locally first. Do not touch Fly until it passes.

### B) Secrets & config expectations

**NextAuth (required):**
- `NEXTAUTH_URL=https://app.artificialexpert.ai`
- `NEXTAUTH_SECRET=<random base64 32+>`
- `GOOGLE_CLIENT_ID=...`
- `GOOGLE_CLIENT_SECRET=...`
- Optional: `ALLOWED_EMAILS=a@b.com,b@c.com`

**Gateway cockpit redirect (runtime):**
- Preferred: `GATEWAY_UI_URL=https://...` (server-only)
- Fallback: `NEXT_PUBLIC_GATEWAY_UI_URL=https://...` (may be flaky for client bundles)

### C) Decide reachability up front
If you need “any device, no VPN”:
- Use a **public HTTPS** gateway URL (Tailscale Funnel or reverse proxy) + token.

If you want maximum security:
- Tailnet-only access (Tailscale Serve) + your devices logged into Tailscale.

---

## Fly Deployment (GitHub-attached)

### 1) Confirm the deploy source is correct
Fly dashboard → app → **Settings → GitHub Repository Settings**
- **Working Directory:** *(blank)* (repo root)
- **Config path:** *(blank)* (defaults to `fly.toml`)
- **Deploy branch:** `main`

> Only set Working Directory for monorepos where `fly.toml` is in a subfolder.

### 2) Deploy
Fly dashboard → **Overview → Deploy app**

### 3) Verify deployed commit
Fly dashboard → Deployments/Activity
- Confirm the deployed commit hash matches what you expect.

---

## Keeping Fly “Warm”

To avoid autosleep:

In `fly.toml`:
```toml
[http_service]
  auto_stop_machines = 'stop'
  auto_start_machines = true
  min_machines_running = 1
```

Commit + push, then Deploy.

Verify in logs:
- You should not see: `autostopping machine... 0 machines left running`

---

## Gateway Exposure (srv1310601)

### A) Current gateway facts (srv1310601)
- Gateway is on `127.0.0.1:18789`
- Auth mode: token

### B) Public URL via Tailscale Funnel (for “any device”)

1) Install & login tailscale (one time):
```bash
curl -fsSL https://tailscale.com/install.sh | sh
sudo tailscale up --ssh --accept-dns=false --hostname=srv1310601-clawdbot
```

2) Enable Funnel/Serve in admin console (one time):
- Funnel: https://login.tailscale.com/f/funnel
- Serve:  https://login.tailscale.com/f/serve

3) Publish the gateway:
```bash
sudo tailscale funnel --bg --yes 18789
sudo tailscale funnel status
```

Disable:
```bash
sudo tailscale funnel --https=443 off
```

---

## UX Escape Hatch: `/cockpit`

We maintain an always-available link that works even if client env vars don’t:

- `GET /cockpit` reads `GATEWAY_UI_URL` (preferred) or `NEXT_PUBLIC_GATEWAY_UI_URL` and redirects.

This prevents “the app is blank / nothing works” while deeper wiring is in progress.

---

## Common Failure Modes & Fast Diagnostics

### 1) Fly build fails
- Check the build log for missing imports / middleware errors.
- Fix locally (`npm run build`) then push.

### 2) UI says env var missing
- Don’t rely on `NEXT_PUBLIC_*` for critical links.
- Use server redirect (`/cockpit`) which reads runtime env.

### 3) Chrome warns “Dangerous site” only in one profile
- Test in Guest/new profile.
- Likely extension/cache issue. Don’t block shipping on it.

### 4) “Feature doesn’t work” but it’s a placeholder
- Confirm whether the page actually fetches data.
- If not wired, add a clear banner + link to cockpit.

---

## Next Runbooks to Create

- RUNBOOK_AUTH.md (Google OAuth setup, redirect URIs, allowlist)
- RUNBOOK_GATEWAY_PUBLIC.md (Funnel vs reverse proxy, token handling)
- RUNBOOK_API_WIRING.md (chat/status/costs endpoints to gateway)
- RUNBOOK_NOTIFICATIONS.md (web push VAPID + subscriptions)
