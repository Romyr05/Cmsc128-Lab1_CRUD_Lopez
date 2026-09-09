import { Router } from "express";

import { getTasks,createTasks, deleteTask, updateTask, restoreTask } from "../controllers/task.controller.js";

const router = Router()

//CRUD routing
router.get("/", getTasks)
router.post("/",createTasks)
router.put("/:id", updateTask)
router.delete("/:id", deleteTask)
router.patch("/:id/restore", restoreTask)  // Only specific fields no need to update whole like put

export default router