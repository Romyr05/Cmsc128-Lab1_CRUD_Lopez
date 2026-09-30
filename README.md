# To-Do List (MERN + TypeScript)

A full-stack to-do list app  tags

## Application description

A full-stack MERN + TypeScript to-do app with **user accounts**. Visitors must
register and log in; the task screen sits behind an authenticated route. Auth
uses a **server-side session** stored in MongoDB with an **httpOnly cookie**, so
a logged-in user stays logged in across refreshes and app restarts. Passwords
are hashed with **argon2**, and password recovery works through an **emailed
reset link** (nodemailer over Gmail SMTP).

## Implemented features

- **Tasks:** create, edit, toggle complete, soft-delete + undo, sort & filter.
- **Register** — email, display name, password (auto-logs you in).
- **Login / Logout** — session created on login, destroyed on logout.
- **Protected routes** — unauthenticated users are redirected to `/login`.
- **Session persistence** — auth state restored from the cookie via `GET /me`.
- **Profile page** — view your name/email (`/profile`).
- **Password recovery** — request a reset link by email, set a new password via
  a one-time, 1-hour-expiry token.
- **Greeting + logout** — `Hello, <name>` on the task screen links to the profile.

> See `AUTH_FEATURE.md` for the full auth architecture and how the files link.

---

## Tech stack & why

**MERN + TypeScript**, split into a separate backend and frontend.

| Layer | Choice | Why |
| --- | --- | --- |
| Database | **MongoDB** (local, via Mongoose) | Documents map naturally to a task object; no rigid table setup. **Mongoose** adds a schema (validation) plus typed models, which pairs well with TypeScript. Runs locally so the app works offline with no cloud account. |
| Backend | **Express** | Minimal Setup and have already little experience |
| Language | **TypeScript** (both sides) | Catches shape mistakes at compile time before they become a problem. Run in dev with **tsx** (transpile + watch, no separate build step). |
| Frontend | **React** | My Most used frontend language and has many libraries and imports |
| UI | **Tailwind CSS** + **shadcn/ui** (Base UI) | Prebuilt components and ease of use |
| Routing | **react-router-dom** | Client-side routes for login/register/profile/reset + a protected-route guard. |
| Auth | **express-session** + **connect-mongo** + **argon2** | Server-side session stored in Mongo; browser holds only an opaque **httpOnly** cookie it can't read (XSS-safe). Not JWT. argon2 hashes passwords. |
| Email | **nodemailer** (Gmail SMTP) | Sends the password-reset link. |
| Validation | **Zod** (shared rules both sides) | Same schemas validate the request body on the backend and the forms on the frontend. |
| Forms / data | **TanStack Form** + **TanStack Query** | Form state/validation and server-state fetching/caching. |

**Persistence model:** the React state is only an in-memory cache. The source of
truth is MongoDB — every create/edit/toggle/delete writes to the database via the
API, and on load the frontend refetches from it. Delete is a **soft delete** (a
`deletedAt` flag), so it persists immediately *and* can be undone without
re-creating the task.

---

## Prerequisites

- **Node.js** 20+ (developed on v24)
- **pnpm** 10+ (`npm i -g pnpm`) — this is a **pnpm workspace** (one lockfile, two packages)
- **MongoDB Community** running locally (this project uses port **27018**)
- A **Gmail App Password** (only needed for password-recovery email) — 2-Step
  Verification on, then generate one at myaccount.google.com/apppasswords

---

## Setup & run locally

The app is two processes (backend + frontend) plus a local MongoDB. Run each in
its own terminal.

### 1. Start MongoDB (port 27018) Had to do this since 27017 is blocked by dorm wifi firewall

```bash
sudo systemctl start mongod && ss -tln | grep 27018 && echo "mongo up ✓"
```

### 2. Install dependencies (once, from the repo root)

Because this is a pnpm workspace, a single install at the root covers both the
backend and the frontend:

```bash
pnpm install
```

### 3. Backend

```bash
# create backend/.env  (see the table below for all keys)
#   MONGO_URI=mongodb://localhost:27018/todoapp
#   PORT=5000
#   SESSION_SECRET=<any long random string>
#   CORS_ORIGIN=http://localhost:5173
#   SMTP_HOST=smtp.gmail.com
#   SMTP_PORT=587
#   SMTP_USER=you@gmail.com
#   SMTP_PASS=<16-char Gmail App Password>
#   FRONTEND_URL=http://localhost:5173

cd backend
pnpm dev          # tsx watch → http://localhost:5000
```

### 4. Frontend

```bash
# create frontend/.env :
#   VITE_API_URL=http://localhost:5000/api/tasks
#   VITE_AUTH_URL=http://localhost:5000/api/auth

cd frontend
pnpm dev          # vite → http://localhost:5173
```

Open **http://localhost:5173** — with no session you land on `/login`.

### Environment variables

| File | Key | Example |
| --- | --- | --- |
| `backend/.env` | `MONGO_URI` | `mongodb://localhost:27018/todoapp` |
| `backend/.env` | `PORT` | `5000` |
| `backend/.env` | `SESSION_SECRET` | any long random string (signs the session cookie) |
| `backend/.env` | `CORS_ORIGIN` | `http://localhost:5173` |
| `backend/.env` | `SMTP_HOST` / `SMTP_PORT` | `smtp.gmail.com` / `587` |
| `backend/.env` | `SMTP_USER` / `SMTP_PASS` | your Gmail / 16-char App Password |
| `backend/.env` | `FRONTEND_URL` | `http://localhost:5173` (builds the reset link) |
| `frontend/.env` | `VITE_API_URL` | `http://localhost:5000/api/tasks` |
| `frontend/.env` | `VITE_AUTH_URL` | `http://localhost:5000/api/auth` |

> If `SMTP_USER`/`SMTP_PASS` are left empty, the reset email isn't sent — instead
> the backend **logs the reset link to the console**, which is handy in dev.

### Database setup

No migrations or seeds needed. MongoDB + Mongoose create the `todoapp` database
and its `tasks` / `users` collections automatically on first write. Just have
`mongod` running on port 27018.

---

## API endpoints (REST)

Base URL: `http://localhost:5000/api/tasks`

| Method | Path | Description |
| --- | --- | --- |
| `GET` | `/api/tasks` | List all active tasks (soft-deleted ones excluded), newest first |
| `POST` | `/api/tasks` | Create a task |
| `PUT` | `/api/tasks/:id` | Update a task (title, completed, priority, tag, due date, description) |
| `DELETE` | `/api/tasks/:id` | Soft-delete a task (sets `deletedAt`) |
| `PATCH` | `/api/tasks/:id/restore` | Undo a soft-delete (clears `deletedAt`) |

### Auth endpoints

Base URL: `http://localhost:5000/api/auth`. All browser calls send
`credentials: "include"` so the session cookie travels both ways.

| Method | Path | Body | Description |
| --- | --- | --- | --- |
| `POST` | `/api/auth/register` | `{ name, email, password }` | Create account, hash password, **start a session (auto-login)** |
| `POST` | `/api/auth/login` | `{ email, password }` | Verify password, start a session |
| `GET` | `/api/auth/me` | — | Who is the current session? Returns the user or `401` |
| `POST` | `/api/auth/logout` | — | Destroy the session, clear the cookie |
| `POST` | `/api/auth/forgot-password` | `{ email }` | Email a reset link; always replies `200` (no account enumeration) |
| `POST` | `/api/auth/reset-password` | `{ token, password }` | Set a new password with a valid, non-expired token |

Quick cURL (cookie jar keeps the session across calls):

```bash
# register (also logs in, saving the cookie)
curl -c jar.txt -X POST localhost:5000/api/auth/register \
  -H 'Content-Type: application/json' \
  -d '{"name":"Ana","email":"ana@x.com","password":"password123"}'

# who am I? (sends the cookie back)
curl -b jar.txt localhost:5000/api/auth/me

# log out
curl -b jar.txt -X POST localhost:5000/api/auth/logout
```

---

## Session mechanism

- On **login/register**, the server saves `req.session.userId` and sends back a
  **signed, httpOnly cookie** (`connect.sid`). The session itself lives in
  MongoDB via **connect-mongo** (`sessions` collection, 14-day TTL); the browser
  only holds the opaque cookie and cannot read it (safe from XSS).
- On every app load, the frontend calls `GET /api/auth/me`; the browser auto-
  sends the cookie, the server reads the session and returns the user — this is
  what keeps you logged in across **refresh and app restart** (the session is a
  real server record, not an in-memory variable).
- **Logout** calls `req.session.destroy()` and clears the cookie, so protected
  pages are no longer reachable.
- The React side mirrors this in an `AuthContext`; a `ProtectedRoute` redirects
  to `/login` whenever there's no user.

## Password-recovery mechanism

1. User submits their email on `/forgot-password` → `POST /forgot-password`.
2. Server generates a random token (`crypto.randomBytes`), stores **only its
   SHA-256 hash** + a **1-hour expiry** on the user, and emails the **raw** token
   as a link: `FRONTEND_URL/reset-password?token=<raw>` (via nodemailer / Gmail).
   The response is always a generic success so you can't probe which emails exist.
3. User opens the link → `/reset-password` reads `?token=` → submits a new
   password → `POST /reset-password { token, password }`.
4. Server hashes the incoming token, finds a user with a matching, **non-expired**
   hash, sets the new argon2 password, and **clears the token** (single-use).

Storing only the token hash means a database leak can't be used to reset
accounts; expiry + single-use limit the window further.

---

## Project structure

```
backend/src/
  server.ts                  app entry (CORS, session, routes)
  config/db.ts               MongoDB connection
  config/mailer.ts           nodemailer transport + sendResetEmail
  schemas/task.schema.ts     Mongoose schema + enums
  schemas/user.schema.ts     user model fields (+ reset token hash/expiry)
  schemas/auth.schema.ts     Zod request validation (register/login/reset)
  models/Task.ts             Mongoose model
  controllers/task.controller.ts  task handlers (CRUD + restore)
  controllers/auth.controller.ts  auth handlers (register/login/me/logout/reset)
  middleware/requireAuth.ts  checkAuth (401 if no session)
  routes/task.routes.ts      task REST routes
  routes/auth.routes.ts      auth routes

frontend/src/
  pages/TasksPage.tsx        main screen (list, editor, sort/filter, greeting + logout)
  pages/LoginPage.tsx        login form
  pages/RegisterPage.tsx     register form
  pages/ForgotPasswordPage.tsx  request a reset link
  pages/ResetPasswordPage.tsx   set a new password (reads ?token=)
  pages/ProfilePage.tsx      view name/email
  context/AuthContext.tsx    auth state + session restore
  components/ProtectedRoute.tsx  redirects to /login when logged out
  components/TaskCard.tsx     one task row
  components/ui/*             shadcn components
  hooks/useTasks.ts          tasks state + all DB operations
  api/tasks.ts               task fetch calls
  api/auth.ts                auth fetch calls (credentials: include)
  lib/authSchema.ts          Zod form schemas (shared rules with backend)
  types/                     shared TypeScript types
  lib/                       helpers (dates, tags, priority)
```


## Screenshots

![alt text](image.png)

![alt text](image-1.png)

![alt text](image-2.png)