# Automated review: feat(accounts): user accounts with synced favorite locations

## Overview

This pull request adds user accounts and cross-device favorite locations to the Skylark weather app. On the API side it introduces HS256 JWT issuance and verification, an authentication middleware, a favorites resource, and in-memory stores for users and favorites. On the web side it adds an authentication context that persists tokens, a sign-in form, a favorites panel that polls the API, and a save-to-favorites control on the current conditions card. Twenty source files change, with 915 additions and 18 deletions.

Four review bots left **44 comments** in total: 12 from the security reviewer, 11 from the architecture reviewer, 4 from the coverage reviewer, and 17 from the style reviewer. By severity that is 1 critical, 7 high, 16 medium, and 20 low.

Overall impression: the feature is functionally complete and the code is readable, but the security posture of the authentication layer is not ready for production. There is one blocking issue (the password hashing scheme), a cluster of high-severity issues around token handling, secret management, and authorization on the favorites resource, and a structural problem in the store layer that will get worse as the feature grows. Test coverage for the new code is thin, and the deployment has an ordering dependency between the API and the web app that must be planned. The seventeen style comments are individually minor and mostly mechanical.

## By file

### `apps/weather-api/src/__tests__/auth.test.ts`

1 comment.

#### 🧪 coverage-bot · **medium** · line 13 · [c-21]

The only auth test is the register-then-login happy path. Line coverage for `routes/auth.ts` in this PR is **38%**. Untested branches:

- register with a duplicate email → 400
- register with a missing field → 400
- login with an unknown email → 401
- login with a wrong password → 401
- `/refresh` with an access token instead of a refresh token → 401
- `/refresh` with a tampered token → 401
- `/me` without a token → 401

Each of these is a five-line test with `app.request`. Several of them are also the security-relevant branches, so they are worth locking down before the fixes land.

### `apps/weather-api/src/app.ts`

4 comments.

#### 🛡️ sentinel-bot · **medium** · line 24 · [c-10]

`origin: '*'` together with `credentials: true` is an invalid combination: browsers reject credentialed responses with a wildcard origin, so this either silently does nothing or will break the moment cookies are introduced (see the token storage discussion). The previous explicit allow-list was correct. Keep the list and add the production web origin from config.

#### 🏛️ archwise-bot · **high** · line 26 · [c-25]

Rollout hazard. The new web build sends `Authorization` on every request, which turns simple GETs into preflighted requests. The **currently deployed** API does not list `Authorization` in `allowHeaders`, so if the web app ships before the API, every forecast and geocode call fails the CORS preflight and the whole app goes blank for signed-in users.

Order of operations has to be: API first (with the header allowed and auth routes live), then web. Please note this in the PR description and split the deploy.

#### 🏛️ archwise-bot · **medium** · line 34 · [c-15]

Between this, the circular store import, and the ownership check that is missing on delete, the favorites feature wants a service layer: `services/favorites.ts` owning "list for user with weather", "add for user", "remove for user", with the stores reduced to dumb maps and the routes reduced to HTTP translation. The dependency graph would then be routes → services → stores/providers with no back edges. Happy to sketch it if useful.

#### 🔍 nitpick-bot · **low** · line 35 · [c-37]

Stray `console.log('routes mounted')` on every app construction, including in tests.

### `apps/weather-api/src/auth/jwt.ts`

1 comment.

#### 🔍 nitpick-bot · **low** · line 1 · [c-30]

`decodeJwt` is imported but never used.

### `apps/weather-api/src/auth/middleware.ts`

3 comments.

#### 🧪 coverage-bot · **medium** · line 14 · [c-23]

`auth/middleware.ts` is at **0%** and `auth/jwt.ts` at **45%** (only the signing path runs). Please add cases for: missing header, malformed header, expired token, wrong signature, and a refresh token presented as an access token. A test that a token signed with a different secret is rejected would also have caught the fallback-secret issue flagged on `config.ts`.

#### 🔍 nitpick-bot · **low** · line 18 · [c-31]

`header.indexOf('Bearer ') == 0` → `header.startsWith('Bearer ')`. Also loose equality; the repo uses `===` everywhere else.

#### 🛡️ sentinel-bot · **medium** · line 22 · [c-05]

Accepting the access token from `?token=` puts bearer credentials into request URLs. URLs end up in access logs, proxy logs, browser history and `Referer` headers. The doc comment says it is "for simple links and debugging", which is exactly how these end up in production.

Remove the query-string path and accept `Authorization: Bearer` only. If a link-based flow is genuinely needed later, it should use a separate short-lived, single-purpose token.

### `apps/weather-api/src/auth/password.ts`

1 comment.

#### 🛡️ sentinel-bot · **critical** · line 5 · [c-01]

Passwords are hashed with a single unsalted SHA-256. That is not a password hash: it is fast, deterministic, and trivially reversible with a rainbow table for any common password. Two users with the same password also get identical hashes, which leaks that fact from the store.

Use a memory-hard KDF with a per-user random salt. Node ships `scrypt` so there is no new dependency:

```ts
import { randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';

const KEY_LENGTH = 64;

export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString('hex');
  const derived = scryptSync(password, salt, KEY_LENGTH).toString('hex');
  return `scrypt$${salt}$${derived}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  const [, salt, expected] = stored.split('$');
  if (!salt || !expected) return false;
  const derived = scryptSync(password, salt, KEY_LENGTH);
  return timingSafeEqual(derived, Buffer.from(expected, 'hex'));
}
```

The `timingSafeEqual` also removes the string-compare timing channel in `verifyPassword`. Blocking.

### `apps/weather-api/src/config.ts`

4 comments.

#### 🛡️ sentinel-bot · **high** · line 15 · [c-04]

`JWT_SECRET` falls back to a hardcoded string. If the env var is missing in staging or production, the API boots normally and signs every token with a secret that is in the public repo. Anyone can then mint valid access tokens for any user id.

Fail loudly instead:

```suggestion
    jwtSecret: requireSecret(env, 'JWT_SECRET'),
```

with a helper that throws at startup when the value is missing or shorter than 32 bytes. A dev-only default is fine if it is gated on `NODE_ENV !== 'production'` and logged as a warning.

#### 🏛️ archwise-bot · **high** · line 15 · [c-26]

Deploy dependency: `JWT_SECRET` is a new required secret for the API in every environment (dev, staging, prod). Because of the fallback default, a missing value does not fail the deploy, it silently signs tokens with the public dev secret. Provision the secret in all environments **before** the API deploy in the rollout sequence, and make the API refuse to start without it.

#### 🛡️ sentinel-bot · **medium** · line 16 · [c-07]

The access token lives for 30 days. Access tokens are bearer credentials with no revocation path in this design, so a leaked one is valid for a month. With a refresh flow already in place there is no reason for the access TTL to exceed 15 minutes or so. Let the refresh token carry the long session.

#### 🔍 nitpick-bot · **low** · line 16 · [c-29]

Magic numbers. `60 * 60 * 24 * 30` and `60 * 60 * 24 * 90` would read better as `30 * DAY_SEC` with a named constant, and the unit is then obvious at the call site.

### `apps/weather-api/src/routes/auth.ts`

6 comments.

#### 🛡️ sentinel-bot · **low** · line 17 · [c-12]

Emails are stored and compared exactly as typed. `Ada@Example.com` and `ada@example.com` become two accounts, and a trailing space produces a third. Normalise with `trim().toLowerCase()` on both register and login before lookup.

#### 🛡️ sentinel-bot · **medium** · line 30 · [c-09]

`/api/auth/login` has no rate limiting, lockout, or delay. Combined with the fast unsalted hash on `password.ts` this makes online credential stuffing cheap. At minimum add a per-IP and per-email limiter (a small token bucket in the existing `TtlCache` would do for now) and return 429 with `Retry-After`.

#### 🔍 nitpick-bot · **low** · line 32 · [c-33]

Leftover debug `console.log`. The app already has the hono `logger()` middleware; if you want the email in logs, do it there deliberately.

#### 🛡️ sentinel-bot · **low** · line 35 · [c-06]

Login returns `No account exists for this email` versus `Incorrect password`. That tells an attacker which emails are registered (user enumeration). Return the same generic 401 for both branches, e.g. `Invalid email or password`, and keep the distinction in server-side logs only if you need it.

#### 🏛️ archwise-bot · **medium** · line 58 · [c-18]

`/refresh` returns the same refresh token it received. Refresh tokens are therefore valid for their full 90 days no matter how often they are used, and a stolen one keeps working alongside the legitimate client indefinitely with no detection.

Two common designs:
- **Rotation.** Each refresh issues a new refresh token and invalidates the old one. A reuse of an old token means theft, and you can revoke the whole family. Needs a small store of issued token ids.
- **Sliding window.** Each refresh extends expiry but keeps the same token. Simpler, no store, but no theft detection.

Given we already have an in-memory store, rotation is not much more work. Either way this decision should be made together with where the client stores tokens.

#### 🔍 nitpick-bot · **low** · line 65 · [c-34]

Response envelope is inconsistent: `/register` and `/login` return `{ user, tokens }`, `/refresh` returns `{ tokens }`, but `/me` returns the bare user object. Wrap it as `{ user }` so clients can treat all auth responses the same way.

### `apps/weather-api/src/routes/favorites.ts`

6 comments.

#### 🧪 coverage-bot · **medium** · line 11 · [c-22]

`routes/favorites.ts` and `store/favorites.ts` have **0%** coverage. No test creates, lists or deletes a favorite, and nothing asserts that user A cannot see or delete user B's favorites. A fake `OpenMeteoClient` already exists in `forecast.test.ts` and can be reused for the enrichment call.

#### 🔍 nitpick-bot · **low** · line 15 · [c-36]

`TODO: remove before merge` — this is the merge. Either remove the hack or turn the TODO into a tracked issue and reference it.

#### 🔍 nitpick-bot · **low** · line 17 · [c-35]

Sequential `await` in a `for` loop. `Promise.all(items.map(...))` reads better and runs the lookups concurrently. (The bigger question of whether the route should do this at all is raised above.)

#### 🏛️ archwise-bot · **medium** · line 18 · [c-14]

The favorites route calls `OpenMeteoClient.forecast()` directly, once per favorite, sequentially. Three things fall out of that:

- It bypasses the `TtlCache` that `routes/forecast.ts` already wraps around the same call, so every panel refresh hits the upstream API even when the forecast route has a fresh copy.
- It is an N+1 against a third-party API with its own rate limits. Ten favorites polled every 5 seconds is 120 upstream calls a minute per user.
- The route layer now depends on the provider client, which was previously only known to the forecast route.

Extract the cached forecast lookup into a shared service that both routes use, and let the panel fetch temperatures lazily or in one batched call.

#### 🛡️ sentinel-bot · **medium** · line 35 · [c-11]

The request body is cast to `FavoriteInput` and stored as-is. Nothing checks that `latitude` is in [-90, 90], that `longitude` is in [-180, 180], that `name` is a string of sane length, or that no extra properties come along for the ride. A client can store a 2 MB `name` or a `timezone` string that later gets interpolated into an upstream URL.

Validate at the edge, for example with zod:

```ts
const FavoriteBody = z.object({
  name: z.string().min(1).max(120),
  country: z.string().max(120),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  timezone: z.string().max(64),
}).strict();

router.post('/', async (c) => {
  const parsed = FavoriteBody.safeParse(await c.req.json());
  if (!parsed.success) throw badRequest(parsed.error.issues[0]?.message ?? 'Invalid body');
  const favorite = addFavorite(c.get('userId'), parsed.data);
  return c.json({ favorite }, 201);
});
```

#### 🛡️ sentinel-bot · **high** · line 41 · [c-03]

`DELETE /api/favorites/:id` deletes whatever id is passed. There is no check that the favorite belongs to `c.get('userId')`. Any authenticated user can delete any other user's favorites by guessing or enumerating ids (IDOR).

Scope the lookup to the caller:

```ts
router.delete('/:id', (c) => {
  const removed = removeFavorite(c.get('userId'), c.req.param('id'));
  if (!removed) throw notFound('Favorite not found');
  return c.body(null, 204);
});
```

and in `store/favorites.ts`:

```ts
export function removeFavorite(userId: string, id: string): boolean {
  const favorite = favorites.get(id);
  if (!favorite || favorite.userId !== userId) return false;
  return favorites.delete(id);
}
```

Returning 404 rather than 403 for someone else's id avoids confirming that the id exists.

### `apps/weather-api/src/store/users.ts`

2 comments.

#### 🏛️ archwise-bot · **high** · line 3 · [c-13]

This introduces a circular import: `store/users.ts` imports `removeFavoritesForUser` from `store/favorites.ts`, and `store/favorites.ts` imports `findById` from `store/users.ts`. It works today only because both are used inside function bodies rather than at module evaluation time. The first time someone adds a top-level constant that touches the other module, one side will see `undefined`.

The cascade delete is an application concern, not a store concern. Move it up: a `deleteAccount(userId)` in a service module can call both stores, and neither store needs to know the other exists.

#### 🔍 nitpick-bot · **low** · line 22 · [c-32]

Naming: `fetchUserByEmail` next to `findById`. Pick one verb. `findByEmail` matches the sibling and `fetch` implies I/O, which this is not.

### `apps/weather-web/src/App.tsx`

1 comment.

#### 🏛️ archwise-bot · **medium** · line 88 · [c-27]

Suggest gating the accounts UI (sign-in form, favorites panel, star button) behind a feature flag so the web bundle can ship dark. That decouples the three steps: 1) provision `JWT_SECRET`, 2) deploy API, 3) deploy web with the flag off, 4) flip the flag. It also gives a one-switch rollback if the auth flow misbehaves in production without redeploying.

### `apps/weather-web/src/api/client.ts`

2 comments.

#### 🏛️ archwise-bot · **medium** · line 43 · [c-17]

When the access token expires, every in-flight request gets a 401 at roughly the same moment and each one calls `tokenProvider.refresh()` independently. On page load that is the forecast request, the favorites poll and `/me` all racing to refresh, and each success overwrites the previous tokens. Once refresh tokens rotate (see the comment on `routes/auth.ts`) all but one of those will fail and sign the user out.

Make refresh single-flight: keep one in-progress promise and have concurrent callers await it.

#### 🏛️ archwise-bot · **high** · line 45 · [c-19]

Unbounded recursion. If the server keeps returning 401 after a successful refresh (for example a user that was deleted, or a token type mismatch), `request()` refreshes and retries forever. Pass a `retried` flag and only attempt the refresh once:

```ts
async function request<T>(path: string, init?: RequestInit, retried = false): Promise<T> {
  ...
  if (res.status === 401 && tokenProvider && !retried) {
    const fresh = await tokenProvider.refresh();
    if (fresh) return request<T>(path, init, true);
  }
  ...
}
```

### `apps/weather-web/src/auth/AuthContext.tsx`

4 comments.

#### 🔍 nitpick-bot · **low** · line 22 · [c-38]

`'skylark.tokens'` is repeated as a literal here while `STORAGE_KEY` exists six lines above. Use the constant.

#### 🛡️ sentinel-bot · **high** · line 28 · [c-02]

Both the access token and the refresh token are written to `localStorage`. Anything that achieves script execution on this origin (a compromised dependency, an XSS in the search results rendering) can read them and has a 90-day session.

Options, roughly in order of preference:
1. Move the refresh token to an `httpOnly; Secure; SameSite=Strict` cookie set by `/api/auth/login`, keep a short-lived access token in memory only.
2. Keep tokens in memory and rely on the refresh endpoint plus a cookie for silent re-auth on reload.
3. Keep `localStorage` but ship a strict CSP and shorten the access TTL drastically.

This interacts with the refresh-token rotation question raised on `routes/auth.ts`, so worth deciding together.

#### 🏛️ archwise-bot · **medium** · line 35 · [c-20]

`atob` expects standard base64 but JWT segments are base64url (`-` and `_` instead of `+` and `/`, no padding). Any payload containing those characters throws `InvalidCharacterError`, and because `decodeUser` runs inside the `useMemo` the whole app tree crashes on mount with a stale token. Convert to base64 and pad before decoding, and wrap it in a try/catch that clears the stored tokens on failure.

#### 🧪 coverage-bot · **low** · line 39 · [c-24]

Nothing on the web side of this PR is tested: `AuthContext`, `useFavorites`, the 401-refresh logic in `api/client.ts`. The repo currently has no web test setup at all, so this may be a follow-up, but the coverage delta for the PR as a whole is **81% → 64%** and the untested code is the code that handles credentials.

### `apps/weather-web/src/auth/LoginForm.tsx`

3 comments.

#### 🛡️ sentinel-bot · **medium** · line 19 · [c-08]

`console.log('auth response', tokens)` prints the access and refresh tokens to the browser console on every sign-in. Consoles are captured by error-reporting tools and session-replay SDKs, and are visible to anyone with the device. Please remove before merge.

#### 🔍 nitpick-bot · **low** · line 28 · [c-39]

Inline `style={{ ... }}` objects. The form already has an `auth-form` class with rules in `styles.css`; move `display`, `flexDirection` and `gap` there (and the `margin: 0` on the heading).

#### 🔍 nitpick-bot · **low** · line 32 · [c-40]

Inputs rely on `placeholder` alone. Placeholders disappear on input and are not reliably announced by screen readers. Add `<label>` elements (visually hidden is fine, there is already a `.visually-hidden` utility in the stylesheet).

### `apps/weather-web/src/favorites/FavoritesPanel.tsx`

2 comments.

#### 🔍 nitpick-bot · **low** · line 17 · [c-42]

Array index as `key`. Favorites have a stable `id`; removing an item from the middle of the list will otherwise re-render and mis-animate every row after it.

#### 🔍 nitpick-bot · **low** · line 36 · [c-43]

Nested ternary. Extract a `formatFavoriteTemp(favorite, units)` helper, or reuse `formatTemp` from `lib/format.ts`, which already does exactly this conversion.

### `apps/weather-web/src/favorites/useFavorites.ts`

1 comment.

#### 🏛️ archwise-bot · **medium** · line 22 · [c-16]

The panel polls `GET /api/favorites` every 5 seconds for as long as the user is signed in, whether or not the tab is visible. Given each call fans out to the weather provider server-side, this is the most expensive loop in the app.

Alternatives, cheapest first:
- Refetch on `visibilitychange` and `focus`, plus after local mutations. Covers the "I added it on my phone" case the moment they come back to the tab.
- Poll, but back off to 60 s and pause while `document.hidden`.
- Server push (SSE) from the favorites route. Real-time, but a new moving part for a list that changes a few times a day.

The first option is probably enough for this feature.

### `apps/weather-web/src/styles.css`

2 comments.

#### 🔍 nitpick-bot · **low** · line 212 · [c-44]

`!important` to override `.app`'s own `max-width` from earlier in the same file. Just change the original rule.

#### 🔍 nitpick-bot · **low** · line 252 · [c-41]

Hardcoded `#38bdf8` twice here; that colour is already `var(--accent)`.

### `packages/weather-core/src/types.ts`

1 comment.

#### 🔍 nitpick-bot · **low** · line 47 · [c-28]

`Record<string, any>` defeats type checking for anything reading preferences. Prefer `Record<string, unknown>` or, better, a concrete `UserPreferences` interface.

## Cross-cutting themes

### 1. Credential handling on both sides of the wire

The most serious findings form one story. Passwords are stored as unsalted SHA-256 digests [c-01], which is a blocking issue on its own. Once a user is signed in, both tokens are written to `localStorage` on the client [c-02] and printed to the browser console on every login [c-08]. The access token is valid for thirty days [c-07], refresh tokens are never rotated so a stolen one works indefinitely [c-18], and the middleware also accepts tokens from the query string, which puts them in logs [c-05]. The architecture reviewer points out that concurrent 401 responses trigger parallel refreshes [c-17], which will start failing the moment rotation is introduced, and that the retry on 401 is unbounded [c-19]. These comments should be resolved as one design decision about where tokens live and how refresh behaves, rather than patched individually.

### 2. Secrets and configuration

`JWT_SECRET` falls back to a hardcoded value that is committed to the repository [c-04]. Both the security and the architecture reviewer flag this, the latter as a deployment dependency: the secret must exist in every environment before the API ships, and the API should refuse to start without it [c-26]. The CORS configuration was changed from an explicit allow-list to a wildcard with credentials, which browsers reject and which will break once cookies are introduced [c-10].

### 3. Authorization and validation on the favorites resource

Deleting a favorite does not check that the favorite belongs to the caller [c-03], so any signed-in user can delete any other user's favorites. The create endpoint stores the request body without validation [c-11]. Both are straightforward to fix and both have concrete replacement code in the comments.

### 4. Module structure in the API

The two new stores import each other [c-13]. The favorites route calls the weather provider directly, bypassing the cache the forecast route already uses, once per favorite and sequentially [c-14], [c-35]. The architecture reviewer proposes a service layer that would remove the cycle and centralise the enrichment [c-15]. On the web side the favorites panel polls every five seconds regardless of tab visibility [c-16], which multiplies the provider calls described above.

### 5. Login hardening

The login route reveals whether an email is registered [c-06], has no rate limiting [c-09], and does not normalise email addresses so the same person can create several accounts [c-12]. These three comments concern the same forty lines of `routes/auth.ts` and are best read together in the file.

### 6. Test coverage

The single new test covers the register-then-login happy path. Coverage for the new auth routes is 38% [c-21], the favorites routes and store are at 0% [c-22], the middleware is at 0% and the JWT module at 45% [c-23], and nothing on the web side is tested [c-24]. The PR moves overall line coverage from 81% to 64%. Several of the untested branches are exactly the security-relevant ones.

### 7. Rollout

The new web build sends an `Authorization` header on every request, which the currently deployed API does not allow through CORS preflight [c-25]. The API must ship first, after the secret is provisioned [c-26], and the web UI should be feature-flagged so it can ship dark and be rolled back with one switch [c-27].

### 8. Style

The style reviewer left seventeen comments: [c-28], [c-29], [c-30], [c-31], [c-32], [c-33], [c-34], [c-35], [c-36], [c-37], [c-38], [c-39], [c-40], [c-41], [c-42], [c-43], [c-44]. They cover an `any` in the shared types, magic numbers, an unused import, loose equality, naming consistency, leftover debug logging, an inconsistent response envelope, a sequential loop, a TODO that should not merge, a duplicated string literal, inline styles, missing form labels, a hardcoded colour, an array index used as a React key, a nested ternary, and an `!important`. Most can be addressed mechanically.

## Where to start

1. **Replace the password hashing** with a salted, memory-hard KDF as proposed in [c-01]. This is blocking and independent of everything else.
2. **Decide the token strategy** once, covering storage location [c-02], access TTL [c-07], refresh rotation [c-18], and the client refresh logic [c-17], [c-19], [c-20]. Then implement it end to end.
3. **Fix authorization and validation on favorites** using the replacement code in [c-03] and [c-11].
4. **Remove the secret fallback and the query-string token path** [c-04], [c-05], and make the API fail to start without `JWT_SECRET` [c-26].
5. **Break the store cycle** and route provider calls through the cached service [c-13], [c-14], [c-15].
6. **Harden the login route** [c-06], [c-09], [c-12] and revert the CORS change [c-10].
7. **Add the missing tests** listed in [c-21], [c-22], [c-23], and plan web tests [c-24].
8. **Agree the deploy sequence** [c-25], [c-26], [c-27] and note it in the PR description.
9. **Decide the sync strategy** for the favorites panel [c-16].
10. **Sweep the style comments** in one pass.

## Statistics

| Bot | Comments |
|---|---|
| 🛡️ sentinel-bot | 12 |
| 🏛️ archwise-bot | 11 |
| 🧪 coverage-bot | 4 |
| 🔍 nitpick-bot | 17 |

| Category | Comments |
|---|---|
| security | 12 |
| architecture | 6 |
| correctness | 2 |
| tests | 4 |
| ops | 3 |
| style | 17 |

| Severity | Comments |
|---|---|
| critical | 1 |
| high | 7 |
| medium | 16 |
| low | 20 |

| Files with comments | 17 |
|---|---|
| Total comments | 44 |
