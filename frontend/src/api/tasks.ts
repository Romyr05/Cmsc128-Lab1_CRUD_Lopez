import type { task, Priority, Tag } from "../types/task"


const api_url = import.meta.env.VITE_API_URL

//CRUD

//READ
export async function getTasks(): Promise<task[]> {
    const res = await fetch(api_url)
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
}): Promise<task> {
    const res = await fetch(api_url, {
        method: "POST",
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
        method: "DELETE"
    })
    if (!res.ok){
        throw new Error("Delete task failed")
    }
}

// Undo a soft delete
export async function restoreTask(id: string): Promise<task> {
    const res = await fetch(`${api_url}/${id}/restore`, {
        method: "PATCH"
    })
    if (!res.ok){
        throw new Error("Restore task failed")
    }
    return res.json()
}