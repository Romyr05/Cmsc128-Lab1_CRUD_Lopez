import { Router } from "express";

import { getTasks,createTasks, deleteTask, updateTask } from "../controllers/task.controller";

const router = Router()

//CRUD routing 
router.get("/", getTasks)
router.post("/",createTasks)
router.put("/:id", updateTask)
router.delete("/:id", deleteTask)

export default router