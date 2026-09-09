import mongoose from "mongoose";

import { interTask, taskSchema } from "../schemas/task.schema.js";

//models -> fancy constructor compiled from Schema definitions

const Task = mongoose.model<interTask>("Task", taskSchema)

export default Task