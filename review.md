# Review — Auth & Account Defense Notes

## Authentication and Account Concepts

### 1. Registration: form submit → stored in DB
1. **UI** — `frontend/src/pages/RegisterPage.tsx`. TanStack Form holds
   `{name, email, password}` and validates on every change against `registerSchema`
   (`frontend/src/lib/authSchema.ts`), so the submit button stays disabled until valid.
2. **Network** — `register()` in `frontend/src/api/auth.ts` POSTs the JSON to
   `/api/auth/register` with `credentials: "include"` so the session cookie the server
   sets comes back and is stored by the browser.
3. **Server validation** — the route runs `validateBody(registerSchema)` first
   (`backend/src/routes/auth.routes.ts`). This middleware
   (`backend/src/middleware/validate.ts`) re-validates with Zod and **replaces
   `req.body` with the parsed/whitelisted data**, so the controller can trust its input.
   Validation runs on both sides; the server copy is the one that actually protects me.
4. **Controller** — `register()` in `backend/src/controllers/auth.controller.ts`:
   - `argon2.hash(password)` → `passwordHash` (plaintext is never stored).
   - `userModel.create({ email, name, passwordHash })` writes the document.
   - `req.session.userId = user.id` logs the new user in immediately.
   - Responds `201` with `{id, email, name}` — **never** the hash.
5. **DB** — Mongoose `userSchema` (`backend/src/schemas/user.schema.ts`) enforces
   `email` `unique` + `lowercase`. A duplicate email throws Mongo error `11000`, which
   the controller maps to `409 "Email already registered!"`.

### 2. Successful login
1. `LoginPage.tsx` → `login()` (`api/auth.ts`) POSTs `{email, password}` to
   `/api/auth/login` with `credentials: "include"`.
2. `login()` controller (`auth.controller.ts`):
   - `userModel.findOne({ email })`. No user → `401 "Invalid Credentials"`.
   - `argon2.verify(user.passwordHash, password)` — argon2 re-hashes the submitted
     password with the parameters embedded in the stored hash and compares. Invalid →
     `401`. **The same generic 401 for both "no user" and "wrong password"** avoids
     telling an attacker which emails exist.
   - On success: `req.session.userId = user.id`. `express-session` saves the session to
     MongoDB (`connect-mongo` store, `server.ts`) and sends a
     `Set-Cookie: connect.sid=...` header. The cookie holds only the signed session ID,
     not any user data.
3. Frontend stores the returned user in `AuthContext` via `setUser` and navigates to `/`.

### 3. Staying logged in across refresh / blocked after logout
- **Across refresh:** the cookie is persistent, so it survives reload. On mount,
  `AuthProvider` (`context/AuthContext.tsx`) calls `getMe()` → `GET /api/auth/me`. The
  server reads `req.session.userId` from the cookie-identified session, looks the user
  up, and returns it; the context rehydrates `user`. While that request is in flight
  `isLoading` is true, so `ProtectedRoute` shows "Loading…" instead of bouncing to
  `/login`.
- **After logout:** `POST /api/auth/logout` runs `req.session.destroy()` (deletes the
  session from Mongo) and `res.clearCookie("connect.sid")` (`auth.controller.ts`). The
  frontend sets `user = null`. Any later `/me` finds no session → `401` → `null`, and
  `ProtectedRoute` redirects to `/login`.

### 4. Why hash passwords, and where
- **Why:** if the DB leaks, plaintext passwords would hand over every account (and any
  reused passwords elsewhere). A hash isn't reversible. I use **argon2** (a slow,
  memory-hard algorithm with a per-hash salt), so even offline brute-force is expensive
  and identical passwords produce different hashes.
- **Where hashed:** `argon2.hash()` in `register` and in `resetPassword`
  (`auth.controller.ts`).
- **Where verified:** `argon2.verify()` in `login`. I never decrypt — I re-hash the
  attempt and compare.

### 5. Profile updates & password recovery — identify account + persist securely
- **Profile updates:** `ProfilePage.tsx` is an editable form (name + email).
  `updateProfile()` (`api/auth.ts`) sends `PATCH /api/auth/me` with the session cookie.
  The route is guarded by `checkAuth` + `validateBody(updateProfileSchema)`
  (`auth.routes.ts`). The controller `updateProfile` (`auth.controller.ts`) loads the
  user **by `req.session.userId` only** — never by anything the client sends — so a user
  can only edit their own account. It assigns `name`/`email`, `user.save()` persists,
  and a duplicate email is mapped to `409`. The fresh user is returned and pushed back
  into `AuthContext` via `setUser`.
- **Password recovery:**
  - *Forgot* — `forgotPassword` (`auth.controller.ts`): find user by email; generate
    `crypto.randomBytes(32)` raw token; store only its **SHA-256 hash**
    (`resetTokenHash`) + a 1-hour `resetTokenExpires`; email the *raw* token in a link.
    The response is **always** the same ("If that email exists…") so emails can't be
    enumerated.
  - *Reset* — `resetPassword`: the account is identified by matching
    `resetTokenHash: hashToken(token)` **and** `resetTokenExpires > now`. On match it
    sets a new argon2 hash and clears the token fields so the link can't be reused.
  - Storing the token hashed (not raw) means a DB leak still can't be used to hijack a
    reset.

---

## Tech Stack and Architecture

### 1. Choices and why
- **Frontend:** React + TypeScript + Vite; TanStack Query (server state) + TanStack
  Form; shadcn/ui components. Type safety + less form/data-fetching boilerplate.
- **Backend:** Node + Express + TypeScript. Standard, lightweight MERN server.
- **Database:** MongoDB via Mongoose — schema + validation on a flexible document store.
- **Auth:** **Server-side sessions** (`express-session` + `connect-mongo`), httpOnly
  cookie, **argon2** for passwords — *not* JWT. Sessions give me server-side logout
  (destroy the record) and keep the token out of JS-readable storage; argon2 is a
  current best-practice password hash.
- **Validation:** Zod schemas mirrored across both sides (`lib/authSchema.ts` mirrors
  `schemas/auth.schema.ts`).

### 2. How the three tiers communicate
- Browser ⇄ backend over HTTP JSON (`fetch`). All auth calls use
  `credentials: "include"`; the server enables `cors({ origin, credentials: true })`
  (`server.ts`) so the cookie flows cross-origin (Vite :5173 ⇄ API :5000).
- Backend ⇄ MongoDB through Mongoose models. Session records also live in Mongo via
  `connect-mongo`.

### 3. Routes / controllers / models / components for register & login
- **Routes:** `backend/src/routes/auth.routes.ts` (`/register`, `/login`, each wrapped
  in `validateBody(...)`).
- **Controllers:** `backend/src/controllers/auth.controller.ts` (`register`, `login`).
- **Model:** `userModel` + `userSchema` (`backend/src/models/userModel.ts`,
  `schemas/user.schema.ts`).
- **Frontend:** `pages/LoginPage.tsx`, `pages/RegisterPage.tsx`, `api/auth.ts`,
  `context/AuthContext.tsx`.

### 4. Secrets / env management
- Secrets read from `process.env` only: `SESSION_SECRET`, `MONGO_URI`, SMTP creds,
  `FRONTEND_URL` (loaded via `dotenv/config`, `server.ts`). Server **throws on startup
  if `SESSION_SECRET` is missing**.
- `.env` is in `.gitignore`, and `git ls-files` confirms **no `.env` is tracked**. Local
  `backend/.env` and `frontend/.env` exist only on disk.

### 5. What supports the next activity's owner-based access control
- The foundation is there: `req.session.userId` identifies the caller, `checkAuth`
  middleware (`middleware/requireAuth.ts`) gates routes, and the new profile-update
  endpoint already demonstrates the pattern — it scopes a write to
  `req.session.userId` so a user can only touch their own record.
- **What's still missing (honest):** the `Task` schema has **no owner field**, and the
  task routes (`routes/task.routes.ts`) **are not yet protected by `checkAuth`**. Next
  activity = add `userId` to `Task`, apply `checkAuth` to task routes, and filter every
  task query by `req.session.userId`.

---

## Code Defense Prompts

### 1. Registration file — main logic
`backend/src/controllers/auth.controller.ts` `register()`: hash password with argon2 →
`userModel.create` → set `req.session.userId` (auto-login) → return safe user fields;
map Mongo `11000` to `409`. Input already Zod-validated by route middleware.

### 2. Hash vs verify
- Hash: `auth.controller.ts` in `register`, `resetPassword`.
- Verify: `auth.controller.ts` in `login` (`argon2.verify`).

### 3. Session creation vs route protection
- **Created:** `req.session.userId = user.id` in `register` and `login`
  (`auth.controller.ts`); cookie/store config in `server.ts`.
- **Protected:** backend `checkAuth` (`middleware/requireAuth.ts`), applied to
  `/logout` and `PATCH /me`; frontend `ProtectedRoute.tsx` wraps `/` and `/profile` in
  `App.tsx`.

### 4. Trace one profile update
1. **UI** — `ProfilePage.tsx` form (name + email), pre-filled from `AuthContext`,
   validated on change by `updateProfileSchema` (`lib/authSchema.ts`).
2. **API** — `updateProfile()` (`api/auth.ts`) sends `PATCH /api/auth/me` with
   `credentials: "include"`.
3. **Route** — `auth.routes.ts`: `checkAuth` → `validateBody(updateProfileSchema)` →
   `updateProfile`.
4. **Controller** — `updateProfile` (`auth.controller.ts`): `findById(
   req.session.userId)` → assign `name`/`email` → `user.save()` (persists; duplicate
   email → `409`) → returns updated user.
5. **UI update** — `setUser(updated)` refreshes context; toast confirms.

### 5. One design decision + alternative + justification
**Decision:** server-side sessions with an httpOnly cookie (`express-session` +
`connect-mongo`).
**Alternative:** stateless JWT in `localStorage`.
**Justification:** the session ID is opaque and not readable by JS (smaller XSS blast
radius), and I can revoke instantly by destroying the server record — real logout. JWTs
can't be revoked before expiry without extra blocklist infrastructure, and storing them
in `localStorage` exposes them to XSS. Cost is a DB lookup per request, acceptable at
this scale.

---

## Known gaps / honesty notes
- Task routes are **not yet auth-guarded** and `Task` has **no owner field** — genuinely
  the next activity's scope.
- The session `cookie.maxAge` is 1 hour (`server.ts`) while the Mongo store `ttl` is 14
  days — a mismatch worth knowing. `httpOnly`/`secure` aren't set explicitly
  (express-session defaults `httpOnly: true`, `secure: false`).
