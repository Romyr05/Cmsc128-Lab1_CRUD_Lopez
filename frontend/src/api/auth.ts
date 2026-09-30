import type {
  LoginValues,
  RegisterValues,
  ForgotPasswordValues,
} from "@/lib/authSchema";

// Auth endpoints live under /api/auth. Kept separate from VITE_API_URL

const auth_url = import.meta.env.VITE_AUTH_URL ?? "http://localhost:5000/api/auth";

// The user shape the backend returns on login / register / me.
export type User = {
  id: string;
  email: string;
  name: string;
};

// Pull the backend's { message } out of an error response, falling back
// to a generic message so the form always has something to show.
async function errorMessage(res: Response, fallback: string): Promise<string> {
  try {
    const body = await res.json();
    return body?.message ?? fallback;
  } catch {
    return fallback;
  }
}

export async function login(data: LoginValues): Promise<User> {
  const res = await fetch(`${auth_url}/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include", // send/receive the session cookie
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error(await errorMessage(res, "Login failed"));
  return res.json();
}

export async function register(data: RegisterValues): Promise<User> {
  const res = await fetch(`${auth_url}/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error(await errorMessage(res, "Registration failed"));
  return res.json();
}

// Request a reset email. The backend always responds success (even for
// unknown emails), so there's no user data to return.
export async function forgotPassword(data: ForgotPasswordValues): Promise<void> {
  const res = await fetch(`${auth_url}/forgot-password`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error(await errorMessage(res, "Request failed"));
}

// Set a new password using the token from the reset email.
export async function resetPassword(data: {
  token: string;
  password: string;
}): Promise<void> {
  const res = await fetch(`${auth_url}/reset-password`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error(await errorMessage(res, "Password reset failed"));
}

// Ask the backend who the current session belongs to. 
// 401 = not logged in -> null siya

export async function getMe(): Promise<User | null> {
  const res = await fetch(`${auth_url}/me`, { credentials: "include" });
  if (res.status === 401) {
    return null;
  }
  if (!res.ok) {
    throw new Error(await errorMessage(res, "Failed to load session"))
  };
  return res.json();
}

export async function logout(): Promise<void> {
  const res = await fetch(`${auth_url}/logout`, {
    method: "POST",
    credentials: "include",
  });
  if (!res.ok) throw new Error(await errorMessage(res, "Logout failed"));
}
