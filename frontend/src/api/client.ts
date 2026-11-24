// One place for the backend URL, the session cookie and error handling.
// Every API file calls request() instead of fetch() directly.

export const API_BASE = import.meta.env.VITE_API_BASE ?? "http://localhost:5000/api";

type RequestOptions = {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  body?: unknown; // sent as JSON
};

// Pull the backend's { message } out of an error response so toasts/forms can show it
// (e.g. "Due date can't be in the past", "No user with that email").
async function errorMessage(res: Response, fallback: string): Promise<string> {
  try {
    const body = await res.json();
    return body?.message ?? fallback;
  } catch {
    return fallback;
  }
}

// fetch() + session cookie + JSON, and throw the backend's message when the response isn't ok
export async function request<T>(
  path: string,
  fallbackError: string,
  { method = "GET", body }: RequestOptions = {},
): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    method,
    credentials: "include", // send/receive the session cookie
    headers: body === undefined ? undefined : { "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  if (!res.ok) throw new Error(await errorMessage(res, fallbackError));
  return res.json();
}
