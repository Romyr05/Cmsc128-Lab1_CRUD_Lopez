import { Request, Response } from "express";
import Task from "../models/Task";


// CRUD (Create, Read, Update, Delete)

//Read
export async function getTasks(_: Request, res:Response): Promise<void> {  //_ for those unused because of ts 
    try {
        const tasks = await Task.find().sort({ createdAt: -1}); // Early first
        res.json(tasks)
    } catch (error) {
        res.status(500).json({ message: "Fetching failed"})
    }
}

//Create
export async function createTasks(req: Request, res: Response): Promise<void>{
    try {
        const {title, due_date, priority, completed} = req.body  
        const task = await Task.create({title, due_date, priority, completed})
        res.status(201).json(task)
    } catch (error) {
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
        }

    } catch (error) {
        res.status(400).json({message : "update failed"})
    }
}

export async function deleteTask(req: Request, res: Response): Promise<void> {
    try {
        const task = await Task.findByIdAndUpdate(req.params.id)
        
        if(!task){
            res.status(404).json({message: "Task not Found"})
        }
    } catch (error) {
        res.status(500).json({message: "Delete task Failed"})
    }
}

