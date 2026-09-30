import { Router } from "express";

import { getTasks,createTasks, deleteTask, updateTask, restoreTask } from "../controllers/task.controller.js";
import { validateBody, validateParams } from "../middleware/validate.js";
import { createTaskSchema, updateTaskSchema } from "shared";
import { taskIdSchema } from "../schemas/taskIdSchema.js";

const router = Router()

//CRUD routing
router.get("/", getTasks)
router.post("/", validateBody(createTaskSchema), createTasks)
router.put("/:id", validateParams(taskIdSchema), validateBody(updateTaskSchema), updateTask)
router.delete("/:id", validateParams(taskIdSchema), deleteTask)
router.patch("/:id/restore", validateParams(taskIdSchema), restoreTask)  // Only specific fields no need to update whole like put

export default router
