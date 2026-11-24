import type { Task, Priority, Tag } from "shared";
import { request } from "./client";

//CRUD

//READ: no listId = my personal tasks, listId = that group list's tasks
export function getTasks(listId?: string): Promise<Task[]> {
  const query = listId ? `?list=${listId}` : "";
  return request<Task[]>(`/tasks${query}`, "Fetching tasks failed");
}

//CREATE
export function createTasks(data: {
  title: string;
  priority: Priority;
  due_date?: string;
  tag?: Tag;
  description?: string;
  completed?: boolean;
  list?: string; // omit = personal task
}): Promise<Task> {
  return request<Task>("/tasks", "Creating Task Failed", { method: "POST", body: data });
}

//UPDATE: updates = only the fields that change
export function updateTask(id: string, updates: Partial<Task>): Promise<Task> {
  return request<Task>(`/tasks/${id}`, "Failed Update Task", { method: "PUT", body: updates });
}

//DELETE (soft delete on the backend)
export async function deleteTask(id: string): Promise<void> {
  await request(`/tasks/${id}`, "Delete task failed", { method: "DELETE" });
}

// Undo a soft delete
export function restoreTask(id: string): Promise<Task> {
  return request<Task>(`/tasks/${id}/restore`, "Restore task failed", { method: "PATCH" });
}
