import type { GroupList, Role } from "@/types/list";

const lists_url = import.meta.env.VITE_LISTS_URL ?? "http://localhost:5000/api/lists";

// Pull the backend's { message } out of an error response so toasts can show it
// (e.g. "No user with that email", "User is already a member").
async function errorMessage(res: Response, fallback: string): Promise<string> {
  try {
    const body = await res.json();
    return body?.message ?? fallback;
  } catch {
    return fallback;
  }
}

// READ: lists I own or have been added to
export async function getLists(): Promise<GroupList[]> {
  const res = await fetch(lists_url, { credentials: "include" });
  if (!res.ok) throw new Error(await errorMessage(res, "Fetching lists failed"));
  return res.json();
}

// CREATE: my one group list
export async function createList(name: string): Promise<void> {
  const res = await fetch(lists_url, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name }),
  });
  if (!res.ok) throw new Error(await errorMessage(res, "Creating list failed"));
}

// Members (owner only, enforced by the backend)
export async function addMember(listId: string, email: string, role: Role): Promise<void> {
  const res = await fetch(`${lists_url}/${listId}/members`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, role }),
  });
  if (!res.ok) throw new Error(await errorMessage(res, "Adding member failed"));
}

export async function updateMemberRole(listId: string, userId: string, role: Role): Promise<void> {
  const res = await fetch(`${lists_url}/${listId}/members/${userId}`, {
    method: "PATCH",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ role }),
  });
  if (!res.ok) throw new Error(await errorMessage(res, "Changing role failed"));
}

export async function removeMember(listId: string, userId: string): Promise<void> {
  const res = await fetch(`${lists_url}/${listId}/members/${userId}`, {
    method: "DELETE",
    credentials: "include",
  });
  if (!res.ok) throw new Error(await errorMessage(res, "Removing member failed"));
}
