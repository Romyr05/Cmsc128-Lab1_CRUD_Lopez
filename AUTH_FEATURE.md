# Auth & User Access — what was built and how it links

This documents the authentication feature (login, register, profile, logout,
protected routes). Session-based auth: the server keeps the session, the
browser holds an **httpOnly cookie**, passwords are hashed with **argon2**.

---

## 1. The big picture (one flow)

```
 Browser (React + react-router)                 Server (Express + Mongoose)
 ───────────────────────────────                ────────────────────────────
 LoginPage / RegisterPage
        │  submit
        ▼
 api/auth.ts  ──(fetch, credentials:"include")──►  routes/auth.routes.ts
        │                                                   │
        │                                                   ▼
        │                                          controllers/auth.controller.ts
        │                                          (argon2 verify, set session)
        │   ◄──────── user JSON + Set-Cookie ───────────────┘
        ▼
 AuthContext.setUser(user)   ←── single source of "who is logged in"
        │
        ├──► ProtectedRoute reads it → allows / or /profile, else → /login
        └──► TasksPage shows "Hello, <name>" + Logout
```

On page refresh, `AuthProvider` calls `GET /api/auth/me`; the browser auto-sends
the cookie, the server reads the session and returns the user — that is what
keeps you logged in across refreshes/restarts.

---

## 2. Where everything lives

### Frontend pages (what you see)
| Page | File | URL |
|------|------|-----|
| Login | `frontend/src/pages/LoginPage.tsx` | `/login` |
| Register | `frontend/src/pages/RegisterPage.tsx` | `/register` |
| Forgot password (email → emails a reset link) | `frontend/src/pages/ForgotPasswordPage.tsx` | `/forgot-password` |
| Reset password (new password, reads `?token=`) | `frontend/src/pages/ResetPasswordPage.tsx` | `/reset-password` |
| Profile (read-only Name/Email + Go back) | `frontend/src/pages/ProfilePage.tsx` | `/profile` |
| Tasks (Hello greeting + Logout) | `frontend/src/pages/TasksPage.tsx` | `/` |

### Frontend plumbing (what links the pages)
| File | Role |
|------|------|
| `frontend/src/main.tsx` | Provider order: `BrowserRouter` → `AuthProvider` → `App` |
| `frontend/src/App.tsx` | Route table; wraps `/` and `/profile` in `ProtectedRoute` |
| `frontend/src/context/AuthContext.tsx` | Holds `user`; restores session via `getMe()` on load; `signOut()` |
| `frontend/src/components/ProtectedRoute.tsx` | Redirects to `/login` when there's no user |
| `frontend/src/api/auth.ts` | `login` / `register` / `getMe` / `logout` fetchers (all `credentials:"include"`) |
| `frontend/src/lib/authSchema.ts` | zod `loginSchema` / `registerSchema` (mirror the backend) |
| `frontend/src/components/ui/input.tsx` | Input primitive (added for the forms) |
| `frontend/src/components/ui/label.tsx` | Label primitive (added for the forms) |

### Backend (what the frontend talks to)
| File | Role |
|------|------|
| `backend/src/routes/auth.routes.ts` | `POST /register`, `/login`, `/forgot-password`, `/reset-password`, `GET /me`, `POST /logout` |
| `backend/src/controllers/auth.controller.ts` | argon2 hashing, session create/destroy, `me`, `forgotPassword`, `resetPassword` |
| `backend/src/config/mailer.ts` | nodemailer SMTP transport + `sendResetEmail` (logs link if SMTP unset) |
| `backend/src/middleware/requireAuth.ts` | `checkAuth` — 401 if no session (guards `/logout`) |
| `backend/src/schemas/auth.schema.ts` | zod validation for register/login bodies |
| `backend/src/models/userModel.ts` | Mongoose User model |
| `backend/src/server.ts` | CORS (origin + `credentials:true`), `express-session`, route mounting |

### Config
| File | Key | Value |
|------|-----|-------|
| `frontend/.env` | `VITE_AUTH_URL` | `http://localhost:5000/api/auth` |
| `backend/.env` | `CORS_ORIGIN` | `http://localhost:5173` |
| `backend/.env` | `MONGO_URI` | `mongodb://localhost:27018/todoapp` |
| `backend/.env` | `SMTP_HOST` / `SMTP_PORT` | `smtp.gmail.com` / `587` |
| `backend/.env` | `SMTP_USER` / `SMTP_PASS` | your Gmail + 16-char App Password |
| `backend/.env` | `FRONTEND_URL` | `http://localhost:5173` (used to build the reset link) |

---

## 3. The routes (who can reach what)

```
/login            public      LoginPage
/register         public      RegisterPage
/forgot-password  public      ForgotPasswordPage
/reset-password   public      ResetPasswordPage  (needs ?token= from the email)
┌─ ProtectedRoute (guard) ─────────────┐
│  /          TasksPage                 │   ← redirect to /login if not logged in
│  /profile   ProfilePage               │
└───────────────────────────────────────┘
```

Navigation links between them:

| From | Trigger | To |
|------|---------|-----|
| LoginPage | "Sign up" link | `/register` |
| LoginPage | "Forgot password?" link (beside Password) | `/forgot-password` |
| ForgotPasswordPage | "Login" link | `/login` |
| RegisterPage | "Login" link | `/login` |
| Login / Register | success → `navigate("/")` | `/` |
| TasksPage | "Hello, <name>" link | `/profile` |
| ProfilePage | "Go back" button | previous page (`navigate(-1)`) |
| TasksPage | "Logout" button | `signOut()` → `/login` |
| ProtectedRoute | no user | `/login` |

---

## 4. The API endpoints

| Method + path | Body | Returns | Notes |
|---------------|------|---------|-------|
| `POST /api/auth/register` | `{ name, email, password }` | `{ id, email, name }` | hashes pw, **starts session (auto-login)** |
| `POST /api/auth/login` | `{ email, password }` | `{ id, email, name }` | verifies pw, starts session |
| `POST /api/auth/forgot-password` | `{ email }` | `{ message }` (always 200) | makes a token, stores its **hash** + 1h expiry, emails the raw token as a link; generic reply = no email enumeration |
| `POST /api/auth/reset-password` | `{ token, password }` | `{ message }` or `400` | hashes token, finds non-expired match, sets new pw, clears token (single-use) |
| `GET /api/auth/me` | — | `{ id, email, name }` or `401` | restores auth state from cookie |
| `POST /api/auth/logout` | — | `{ message }` | destroys session, clears cookie |

All frontend calls send `credentials:"include"`; the server allows that origin
with `credentials:true`, so the session cookie flows both ways.

---

## 5. How to run

```bash
# 1. MongoDB (port 27018 — see README)
sudo systemctl start mongod && ss -tln | grep 27018

# 2. Backend
cd backend && pnpm dev          # http://localhost:5000

# 3. Frontend
cd frontend && pnpm dev         # http://localhost:5173
```

Open http://localhost:5173 — with no session you land on `/login`.

---

## 6. Not built yet (lab requirements still open)

- **Profile editing** — the page is read-only; updating name/email/password
  (with uniqueness validation) needs a new endpoint (e.g. `PATCH /api/auth/me`)
  and a form.
- **Server-side task protection** — `/api/tasks` has no `checkAuth` and
  `frontend/src/api/tasks.ts` doesn't send `credentials`, so tasks aren't
  per-user yet.

