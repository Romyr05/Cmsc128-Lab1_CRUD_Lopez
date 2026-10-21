// This is used for the business logic, validation and status error for those

import { Request, Response } from "express";
import { isValidObjectId } from "mongoose";
import Task from "../models/Task.js";
import { getListRole, canEdit } from "../utils/listAccess.js";



function isValidDueDate(due_date: Date): boolean {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1); // now + 1 day
    return due_date >= tomorrow;              // true = OK, false = too soon
}

// Find a task the logged-in user may modify, or send 404/403 and return null.
// Personal task -> only its owner. List task -> list owner or "edit" member.
async function findEditableTask(req: Request, res: Response) {
    const me = req.session.userId!  // checkAuth guarantees userId
    const task = await Task.findById(req.params.id)
    if (!task) {
        res.status(404).json({ message: "Task not Found" })
        return null
    }

    if (!task.list) {
        // Personal: someone else's task -> 404, same as if it didn't exist (prevents IDOR)
        if (!task.owner.equals(me)) {
            res.status(404).json({ message: "Task not Found" })
            return null
        }
        return task
    }

    const role = await getListRole(task.list.toString(), me)
    if (role === null) {
        res.status(404).json({ message: "Task not Found" })  // not in that list
        return null
    }
    if (!canEdit(role)) {
        res.status(403).json({ message: "You only have view access to this list" })
        return null
    }
    return task
}

// CRUD (Create, Read, Update, Delete)

//Read: GET /api/tasks -> my personal tasks, GET /api/tasks?list=<id> -> that list's tasks (members only)
export async function getTasks(req: Request, res:Response): Promise<void> {
    const me = req.session.userId!
    const listId = req.query.list
    try {
        if (listId === undefined) {
            // list: null also matches tasks with no list field at all
            const tasks = await Task.find({ owner: me, list: null, deletedAt: null }).sort({ createdAt: -1}); // active only, newest first
            res.json(tasks)
            return
        }

        if (typeof listId !== "string" || !isValidObjectId(listId)) {
            res.status(400).json({ message: "Invalid list id" })
            return
        }
        const role = await getListRole(listId, me)
        if (role === null) {
            res.status(404).json({ message: "List not found" })  // not a member -> don't reveal it exists
            return
        }
        const tasks = await Task.find({ list: listId, deletedAt: null }).sort({ createdAt: -1})
        res.json(tasks)
    } catch (error) {
        res.status(500).json({ message: "Fetching failed"})
    }
}

//Create
export async function createTasks(req: Request, res: Response): Promise<void>{
    // Body is already validated & whitelisted by validateBody(createTaskSchema).
    // Business rule stays here: due_date arrives as a Date thanks to z.coerce.date().
    const { due_date, list } = req.body
    if (due_date && !isValidDueDate(due_date)) {
        res.status(400).json({ message: "Due date must be at least 1 day from now" });
        return;
    }

    try {
        // Creating inside a list requires owner/edit access to that list
        if (list) {
            const role = await getListRole(list, req.session.userId!)
            if (role === null) {
                res.status(404).json({ message: "List not found" })
                return
            }
            if (!canEdit(role)) {
                res.status(403).json({ message: "You only have view access to this list" })
                return
            }
        }

        const task = await Task.create({...req.body, owner: req.session.userId})
        res.status(201).json(task)
    } catch (error) {
        console.error("Create task error:", error)
        res.status(500).json({message: "Create Task Failed"})
    }
}

// Update
export async function updateTask(req: Request, res:Response): Promise<void> {
    const { due_date } = req.body
    if (due_date && !isValidDueDate(due_date)) {
        res.status(400).json({ message: "Due date must be at least 1 day from now" });
        return;
    }

    try {
        const task = await findEditableTask(req, res)
        if (!task) return  // 404/403 already sent

        Object.assign(task, req.body)  // body is whitelisted (no owner/list), so only task fields change
        await task.save()              // save() runs schema validators
        res.json(task)

    } catch (error) {
        res.status(400).json({message : "update failed"})
    }
}

// Soft delete: mark the task instead of removing it
export async function deleteTask(req: Request, res: Response): Promise<void> {
    try {
        const task = await findEditableTask(req, res)
        if (!task) return

        task.deletedAt = new Date()
        await task.save()
        res.json(task)
    } catch (error) {
        res.status(500).json({message: "Delete task Failed"})
    }
}

// Undo a soft delete
export async function restoreTask(req: Request, res: Response): Promise<void> {
    try {
        const task = await findEditableTask(req, res)
        if (!task) return

        task.deletedAt = null
        await task.save()
        res.json(task)
    } catch (error) {
        res.status(500).json({message: "Restore task Failed"})
    }
}
