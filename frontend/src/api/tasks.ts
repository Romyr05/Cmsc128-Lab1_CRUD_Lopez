import type { Task, Priority, Tag } from "shared";


const api_url = import.meta.env.VITE_API_URL

// Pull the backend's { message } out of an error response so toasts can show it
// (e.g. "Due date can't be in the past", "You only have view access to this list").
async function errorMessage(res: Response, fallback: string): Promise<string> {
  try {
    const body = await res.json();
    return body?.message ?? fallback;
  } catch {
    return fallback;
  }
}

//CRUD

//READ: no listId = my personal tasks, listId = that group list's tasks
export async function getTasks(listId?: string): Promise<Task[]> {
    const url = listId ? `${api_url}?list=${listId}` : api_url
    const res = await fetch(url, { credentials: "include" }) // send the session cookie
    if(!res.ok) throw new Error(await errorMessage(res, "Fetching tasks failed"))
    return res.json()
}

//CREATE
export async function createTasks( data : {
    title: string,
    priority: Priority,
    due_date?: string,
    tag?: Tag,
    description?: string,
    completed?: boolean,
    list?: string,   // omit = personal task
}): Promise<Task> {
    const res = await fetch(api_url, {
        method: "POST",
        credentials: "include",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify(data)
    })

    if (!res.ok){
        throw new Error(await errorMessage(res, "Creating Task Failed"))
    } 
    return res.json()
}

//UPDATE
export async function updateTask(
    id: string,
    updates: Partial<Task>    //Optional some of hte fileds
): Promise<Task> {
    const res = await fetch(`${api_url}/${id}`, {
        method: "PUT",
        credentials: "include",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(updates)
    })
    if (!res.ok){
        throw new Error(await errorMessage(res, "Failed Update Task"))
    }
    return res.json()
}


//Delete
export async function deleteTask(id: string): Promise<void> {
    const res = await fetch(`${api_url}/${id}`, {
        method: "DELETE",
        credentials: "include",
    })
    if (!res.ok){
        throw new Error(await errorMessage(res, "Delete task failed"))
    }
}

// Undo a soft delete
export async function restoreTask(id: string): Promise<Task> {
    const res = await fetch(`${api_url}/${id}/restore`, {
        method: "PATCH",
        credentials: "include",
    })
    if (!res.ok){
        throw new Error(await errorMessage(res, "Restore task failed"))
    }
    return res.json()
}