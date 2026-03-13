# Test Coverage Analysis

## Current State

**Test coverage: 0%.** The codebase has no test framework installed, no test configuration, no test files, and no CI pipeline that runs tests. There are 17 TypeScript/TSX source files, none of which have corresponding tests.

---

## Priority 1 — High-Value Unit Tests (pure logic, easy to test)

### 1. `app/lib/gateway-client.ts` — `extractAssistantText` and `extractAgentResultText`

These two functions contain the most complex pure logic in the codebase: recursive payload parsing with multiple fallback paths. They are **the single highest-value place to add tests**.

**What to test:**
- String input returns trimmed string
- Object with `.text`, `.message`, `.outputText` fields
- Array-style `summary` / `output` / `content` with mixed element types (`string`, `{text}`, `{summary_text}`)
- Nested object fallback (recursive call)
- Final JSON.stringify fallback for unrecognized shapes
- `null` / `undefined` input returns `""`
- `extractAgentResultText`: `result.payloads[].text` extraction, `.summary` fallback, delegation to `extractAssistantText`

**Effort:** Low. These are pure functions with no side effects — no mocking required.

### 2. `src/authOptions.ts` — `parseAllowList` and `signIn` callback

The email allow-list logic controls **who can access the entire application**.

**What to test:**
- `ALLOWED_EMAILS` unset → all users allowed
- `ALLOWED_EMAILS` set → only listed emails pass
- Case insensitivity (`User@Example.COM` matches `user@example.com`)
- Whitespace/comma handling (`" a@b.com , c@d.com "`)
- Empty string / only commas → treated as no allow-list
- Missing `profile.email` → sign-in denied

**Effort:** Low. Pure logic; just needs `process.env` stubbing.

### 3. `app/cockpit/route.ts` — `normalizeBase` and URL construction

The cockpit route builds a redirect URL with sensitive tokens in query parameters.

**What to test:**
- Trailing-slash normalization (`https://foo.com///` → `https://foo.com/`)
- Token and gatewayUrl are appended as search params when present
- Missing `GATEWAY_UI_URL` returns 500
- Incoming request query params are forwarded (non-conflicting only)

**Effort:** Low. Mostly pure logic with env var stubbing.

---

## Priority 2 — API Route Tests (request/response contracts)

### 4. `app/api/chat-send/route.ts`

**What to test:**
- Missing/empty `text` → 400 with `{ error: "Invalid text" }`
- Valid request → calls `sendChat` with correct `sessionKey` (custom or default)
- `sendChat` throws → 500 with error message
- Non-string `sessionKey` → falls back to `"agent:main:web"`

**Effort:** Medium. Requires mocking `sendChat` from `gateway-client`.

### 5. `app/api/web-search/route.ts`

The most complex API route with input validation, clamping, and external API integration.

**What to test:**
- Missing `TAVILY_API_KEY` → 500
- Missing/empty `query` → 400
- `maxResults` clamping: values < 1, > 10, non-numeric, float → correctly bounded to 1–10
- Successful Tavily response → correct shape returned (only `title`, `url`, `content`, `score`)
- Tavily HTTP error → 502 with forwarded message
- Malformed JSON body → treated as empty `{}`

**Effort:** Medium. Requires mocking `fetch` for the Tavily API call.

### 6. `app/api/costs/route.ts` and `app/api/status/route.ts`

Both follow the same pattern: call `getHealth()`, extract session data, return JSON.

**What to test:**
- Happy path with a matching `agent:main:main` session
- No matching session → graceful fallback (`totalTokens: 0` for costs, `null` for status)
- `getHealth` throws → 500 error response
- Verify computed fields (`ageMin` rounding, token fields)

**Effort:** Medium. Requires mocking `getHealth`.

---

## Priority 3 — Middleware and Integration

### 7. `middleware.ts` — Route protection

**What to test:**
- Protected routes (e.g., `/`, `/settings`) require a token
- Excluded routes (`/api/auth`, `/api/ping`, `/api/status`, `/api/costs`, `/api/chat-send`, `/_next/*`) are accessible without auth
- Edge cases in the regex matcher

**Effort:** Medium-High. Requires `next-auth/middleware` mocking or integration test setup.

### 8. `app/lib/gateway-client.ts` — `gatewayCall` (WebSocket logic)

The WebSocket connection/request lifecycle has several states and error paths.

**What to test:**
- Successful connect → send request → receive response → resolve
- Connect failure (`msg.ok === false`) → reject
- Agent method: `accepted` status keeps waiting, `error` status rejects, `ok` status resolves
- Timeout after 60s → terminates and rejects
- WebSocket error event → reject
- Connection closed before connect → reject

**Effort:** High. Requires a mock WebSocket server or library-level mocking of `ws`.

---

## Priority 4 — React Component Tests

### 9. `app/page.tsx` (ChatPage)

**What to test:**
- Renders initial assistant greeting
- Typing and pressing Enter sends a message
- Shows "Thinking..." loading state
- Displays reply from API
- Displays error on fetch failure
- Empty input does not trigger send
- `sessionKey` is persisted in localStorage

**Effort:** Medium. Requires `@testing-library/react`, `fetch` mocking, `localStorage` mocking.

### 10. `app/research/page.tsx` (ResearchPage)

**What to test:**
- Search triggers API call with correct payload
- Results and answer are rendered
- Error state displayed on failure
- Loading state disables button

### 11. `app/status/page.tsx` and `app/costs/page.tsx`

**What to test:**
- Loading → data → rendered state
- Error handling and display
- Correct number formatting (`.toLocaleString()`, `.toFixed()`)

---

## Recommended Test Framework Setup

```bash
npm install --save-dev vitest @testing-library/react @testing-library/jest-dom jsdom
```

**Why Vitest:** Native TypeScript/ESM support, fast execution, compatible with Next.js, Jest-compatible API.

Suggested `vitest.config.ts`:
```ts
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    include: ['**/*.test.{ts,tsx}'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      include: ['app/**', 'src/**'],
    },
  },
});
```

Add to `package.json` scripts:
```json
"test": "vitest run",
"test:watch": "vitest",
"test:coverage": "vitest run --coverage"
```

---

## Suggested File Structure

```
__tests__/
  lib/
    gateway-client.test.ts          ← Priority 1 (extractors + gatewayCall)
  auth/
    authOptions.test.ts             ← Priority 1 (allow-list + signIn)
  api/
    chat-send.test.ts               ← Priority 2
    web-search.test.ts              ← Priority 2
    costs.test.ts                   ← Priority 2
    status.test.ts                  ← Priority 2
    cockpit.test.ts                 ← Priority 1
    ping.test.ts                    ← Trivial, low priority
  middleware.test.ts                ← Priority 3
  pages/
    ChatPage.test.tsx               ← Priority 4
    ResearchPage.test.tsx           ← Priority 4
    StatusPage.test.tsx             ← Priority 4
    CostsPage.test.tsx              ← Priority 4
```

---

## Summary Table

| Area | Files | Priority | Effort | Impact |
|------|-------|----------|--------|--------|
| Payload extractors | `gateway-client.ts` | **P1** | Low | High — complex branching, silent bugs |
| Auth allow-list | `authOptions.ts` | **P1** | Low | High — controls app access |
| Cockpit redirect | `cockpit/route.ts` | **P1** | Low | Medium — URL construction with secrets |
| Chat API | `chat-send/route.ts` | **P2** | Medium | High — main user-facing endpoint |
| Web Search API | `web-search/route.ts` | **P2** | Medium | Medium — input validation, external API |
| Costs/Status APIs | `costs/route.ts`, `status/route.ts` | **P2** | Medium | Medium — data extraction logic |
| Middleware | `middleware.ts` | **P3** | Medium-High | High — route protection |
| WebSocket client | `gateway-client.ts` | **P3** | High | High — core communication |
| React pages | `page.tsx`, `research/page.tsx`, etc. | **P4** | Medium | Lower — mostly fetch + render |

**Recommendation:** Start with Priority 1 items. They cover the most complex logic with the least setup effort and will catch the most likely bugs (payload parsing edge cases, auth bypass via misconfigured allow-list, redirect URL issues).
