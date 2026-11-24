// Shared by backend (request validation) and frontend (form validation),
// so both sides always use the same rules.
import { z } from "zod";

// POST /api/auth/register — all fields required.
export const registerSchema = z.object({
  email: z.email("Invalid email").trim(),
  name: z.string().trim().min(1, "Name is required"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

// PATCH /api/auth/me — update the logged-in user's editable fields.
export const updateProfileSchema = z.object({
  email: z.email("Invalid email").trim(),
  name: z.string().trim().min(1, "Name is required"),
});

// POST /api/auth/change-password — only what the server needs.
// confirmPassword is a frontend-only typo check (see ProfilePage).
export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z.string().min(8, "Password must be at least 8 characters"),
});

// POST /api/auth/login — email + password only.
export const loginSchema = z.object({
  email: z.email("Invalid email").trim(),
  password: z.string().min(1, "Password is required"),
});

// POST /api/auth/forgot-password — just the email to send a reset link to.
export const forgotPasswordSchema = z.object({
  email: z.email("Invalid email").trim(),
});

// POST /api/auth/reset-password — the token from the email + the new password.
export const resetPasswordSchema = z.object({
  token: z.string().min(1, "Token is required"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

// Types for the frontend forms and API calls
export type LoginValues = z.infer<typeof loginSchema>;
export type RegisterValues = z.infer<typeof registerSchema>;
export type UpdateProfileValues = z.infer<typeof updateProfileSchema>;
export type ChangePasswordValues = z.infer<typeof changePasswordSchema>;
export type ForgotPasswordValues = z.infer<typeof forgotPasswordSchema>;
