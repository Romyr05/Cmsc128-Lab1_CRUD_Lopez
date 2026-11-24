import type { GroupList, Role } from "@/types/list";
import { request } from "./client";

// READ: lists I own or have been added to
export function getLists(): Promise<GroupList[]> {
  return request<GroupList[]>("/lists", "Fetching lists failed");
}

// CREATE: my one group list
export async function createList(name: string): Promise<void> {
  await request("/lists", "Creating list failed", { method: "POST", body: { name } });
}

// Members (owner only, enforced by the backend)
export async function addMember(listId: string, email: string, role: Role): Promise<void> {
  await request(`/lists/${listId}/members`, "Adding member failed", {
    method: "POST",
    body: { email, role },
  });
}

export async function updateMemberRole(listId: string, userId: string, role: Role): Promise<void> {
  await request(`/lists/${listId}/members/${userId}`, "Changing role failed", {
    method: "PATCH",
    body: { role },
  });
}

export async function removeMember(listId: string, userId: string): Promise<void> {
  await request(`/lists/${listId}/members/${userId}`, "Removing member failed", {
    method: "DELETE",
  });
}
