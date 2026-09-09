import { Request, Response } from "express";
import Task from "../models/Task.js";



function isValidDueDate(due_date: Date): boolean {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1); // now + 1 day
    return due_date >= tomorrow;              // true = OK, false = too soon
}

// CRUD (Create, Read, Update, Delete)

//Read
export async function getTasks(_: Request, res:Response): Promise<void> {  //_ for those unused because of ts 
    try {
        const tasks = await Task.find({ deletedAt: null }).sort({ createdAt: -1}); // active only, newest first
        res.json(tasks)
    } catch (error) {
        res.status(500).json({ message: "Fetching failed"})
    }
}

//Create
export async function createTasks(req: Request, res: Response): Promise<void>{
    try {
        const {title, due_date, priority, completed, tag, description} = req.body
        if (due_date && !isValidDueDate(new Date(due_date))) {
            res.status(400).json({ message: "Due date must be at least 1 day from now" });
            return;
        }

        const task = await Task.create({title, due_date, priority, completed, tag, description})
        res.status(201).json(task)
    } catch (error) {
        console.error("Create task error:", error)
        res.status(400).json({message: "Create Task Failed"})
    }
}

// Update
export async function updateTask(req: Request, res:Response): Promise<void> {
    try {
        const tasks = await Task.findByIdAndUpdate(req.params.id, req.body, {
            //Options
            new: true,
            runValidators: true
        })
        if(!tasks){
            res.status(404).json({message: "Task Not found"})
            return;
        }
        res.json(tasks)

    } catch (error) {
        res.status(400).json({message : "update failed"})
    }
}

// Soft delete: mark the task instead of removing it
export async function deleteTask(req: Request, res: Response): Promise<void> {
    try {
        const task = await Task.findByIdAndUpdate(
            req.params.id,
            { deletedAt: new Date() },
            { new: true }
        )

        if(!task){
            res.status(404).json({message: "Task not Found"})
            return;
        }
        res.json(task)
    } catch (error) {
        res.status(500).json({message: "Delete task Failed"})
    }
}

// Undo a soft delete: clear the flag
export async function restoreTask(req: Request, res: Response): Promise<void> {
    try {
        const task = await Task.findByIdAndUpdate(
            req.params.id,
            { deletedAt: null },
            { new: true }
        )

        if(!task){
            res.status(404).json({message: "Task not Found"})
            return;
        }
        res.json(task)
    } catch (error) {
        res.status(500).json({message: "Restore task Failed"})
    }
}

