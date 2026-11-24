# Change password (on the Profile page) — plan

Status: **built.**

A logged-in user can change their password on `/change-password` (opened from
the "Change password" button on `/profile`) by entering their
**current password**, a **new password**, and **confirm password**.

---

## Why ask for the current password?

Being logged in only proves the browser holds the session cookie. If someone
leaves a laptop unlocked, another person could change the password and lock
the owner out. Asking for the current password proves the account owner is the
one at the keyboard. The server checks it with `argon2.verify`, the same way
`login` does.

---

## The flow

```
 ProfilePage ──"Change password" button──► ChangePasswordPage (current / new / confirm)
        │  submit (zod changePasswordFormSchema checks first, incl. "passwords match")
        │  sends only { currentPassword, newPassword }
        ▼
 api/auth.ts changePassword()  ──►  POST /api/auth/change-password
                                          │ checkAuth           → 401 if no session
                                          │ validateBody(schema) → 400 if invalid
                                          ▼
                                 controllers/auth.controller.ts changePassword
                                   1. user = findById(req.session.userId)
                                   2. argon2.verify(current) → 400 if wrong
                                   3. passwordHash = argon2.hash(new)
                                      clear resetTokenHash / resetTokenExpires
                                   4. regenerate session, set userId again
                                   5. 200 { message: "Password updated" }
        ◄──────────────────────────────────┘
 toast "Password updated", navigate to /profile
```

---

## Changes by layer

### 1. Shared schema — `shared/src/auth.schema.ts`
Only the fields the **server** needs:
```ts
export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z.string().min(8, "Password must be at least 8 characters"),
});

export type ChangePasswordValues = z.infer<typeof changePasswordSchema>;
```
`confirmPassword` is **not** here. Backend validation protects the server
(missing fields, passwords that are too short). The confirm field only protects
the user from typos, and someone calling the API directly would just send the
same string twice. So the match check lives on the page (see 4).

### 2. Backend
- `backend/src/routes/auth.routes.ts`:
  `router.post("/change-password", checkAuth, validateBody(changePasswordSchema), changePassword)`
- `backend/src/controllers/auth.controller.ts`: new `changePassword` (steps in
  the flow above).
  - The user always comes from the **session**, never the request body, so
    users can only change their own password.
  - A wrong current password returns **400**, not 401. 401 means "not logged
    in", and the user is logged in.
  - Clearing the reset token means an older "forgot password" email link stops
    working after the change.
  - Regenerating the session gives a fresh session id after a security
    change, the same idea as on login.

### 3. Frontend API — `frontend/src/api/auth.ts`
`changePassword(data: ChangePasswordValues)` → `request("/auth/change-password", ..., { method: "POST", body: data })`.
The existing `request()` already shows the backend's error message.

### 4. Frontend page — `frontend/src/pages/ChangePasswordPage.tsx` (`/change-password`)
Its own page, protected by `ProtectedRoute` in `App.tsx`. Profile has a
"Change password" outline button that opens it. It's built from the same
shadcn pieces as the other auth pages: `AuthCard` (shadcn `Card`), `FormField`
(shadcn `Input` + `Label`), and shadcn `Button`. It has 3 `type="password"`
fields, an error line, a submit button, and "Cancel" (back to `/profile`). On
success it shows a toast and navigates to `/profile`.

The form builds its own schema from the shared one, the same pattern as
`ResetPasswordPage` (`resetPasswordSchema.omit({ token: true })`):
```ts
const changePasswordFormSchema = changePasswordSchema
  .extend({ confirmPassword: z.string() })
  .refine((d) => d.newPassword === d.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });
```
`.refine` is a check that looks at several fields together. Per-field rules
can't compare two fields, so "passwords match" needs one. `path` puts the
error under the confirm field. On submit, the page sends only
`{ currentPassword, newPassword }`.

### Endpoint summary
| Method + path | Body | Returns | Notes |
|---------------|------|---------|-------|
| `POST /api/auth/change-password` | `{ currentPassword, newPassword }` | `{ message }`, `400`, or `401` | requires session; verifies current pw; rehashes; regenerates session |

No new files besides this doc, no new dependencies, no database schema change.

---

## Open questions / assumptions

- **Decided: other logged-in devices stay logged in** (for now). Sessions live
  in MongoDB through connect-mongo. Logging out every other session would mean
  searching that collection for the user's `userId`, which adds complexity we
  don't need yet.
- **Verified: TanStack Form + `.refine` path.** With a form-level `onChange`
  schema, the "Passwords don't match" error lands only on `confirmPassword`,
  and `canSubmit` turns back on once the two match.
- **Decided: `confirmPassword` is checked on the frontend only.** The shared
  schema has `currentPassword` + `newPassword`. The page extends it with the
  confirm field and the match check.
