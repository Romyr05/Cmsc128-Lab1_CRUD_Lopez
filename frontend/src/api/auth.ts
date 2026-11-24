import type {
  LoginValues,
  RegisterValues,
  ForgotPasswordValues,
  UpdateProfileValues,
} from "shared";
import { API_BASE, request } from "./client";

// The user shape the backend returns on login / register / me.
export type User = {
  id: string;
  email: string;
  name: string;
};

export function login(data: LoginValues): Promise<User> {
  return request<User>("/auth/login", "Login failed", { method: "POST", body: data });
}

export function register(data: RegisterValues): Promise<User> {
  return request<User>("/auth/register", "Registration failed", { method: "POST", body: data });
}

// Update the logged-in user's profile. Returns the updated user so the
// AuthContext can refresh its state.
export function updateProfile(data: UpdateProfileValues): Promise<User> {
  return request<User>("/auth/me", "Profile update failed", { method: "PATCH", body: data });
}

// Request a reset email. The backend always responds success (even for
// unknown emails), so there's no user data to return.
export async function forgotPassword(data: ForgotPasswordValues): Promise<void> {
  await request("/auth/forgot-password", "Request failed", { method: "POST", body: data });
}

// Set a new password using the token from the reset email.
export async function resetPassword(data: { token: string; password: string }): Promise<void> {
  await request("/auth/reset-password", "Password reset failed", { method: "POST", body: data });
}

// Ask the backend who the current session belongs to.
// 401 = not logged in -> null siya (a normal answer here, not an error,
// so this one uses fetch directly instead of request())
export async function getMe(): Promise<User | null> {
  const res = await fetch(`${API_BASE}/auth/me`, { credentials: "include" });
  if (res.status === 401) {
    return null;
  }
  if (!res.ok) {
    throw new Error("Failed to load session");
  }
  return res.json();
}

export async function logout(): Promise<void> {
  await request("/auth/logout", "Logout failed", { method: "POST" });
}
