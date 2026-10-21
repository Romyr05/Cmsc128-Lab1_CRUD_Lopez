import type { task, Priority, Tag } from "../types/task"


const api_url = import.meta.env.VITE_API_URL

//CRUD

//READ: no listId = my personal tasks, listId = that group list's tasks
export async function getTasks(listId?: string): Promise<task[]> {
    const url = listId ? `${api_url}?list=${listId}` : api_url
    const res = await fetch(url, { credentials: "include" }) // send the session cookie
    if(!res.ok) throw new Error("Fetching tasks failed")
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
}): Promise<task> {
    const res = await fetch(api_url, {
        method: "POST",
        credentials: "include",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify(data)
    })

    if (!res.ok){
        throw new Error("Creating Task Failed")
    } 
    return res.json()
}

//UPDATE
export async function updateTask(
    id: string,
    updates: Partial<task>    //Optional some of hte fileds
): Promise<task> {
    const res = await fetch(`${api_url}/${id}`, {
        method: "PUT",
        credentials: "include",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(updates)
    })
    if (!res.ok){
        throw new Error("Failed Update Task")
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
        throw new Error("Delete task failed")
    }
}

// Undo a soft delete
export async function restoreTask(id: string): Promise<task> {
    const res = await fetch(`${api_url}/${id}/restore`, {
        method: "PATCH",
        credentials: "include",
    })
    if (!res.ok){
        throw new Error("Restore task failed")
    }
    return res.json()
}