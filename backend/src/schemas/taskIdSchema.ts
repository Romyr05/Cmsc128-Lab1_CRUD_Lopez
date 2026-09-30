import { isValidObjectId } from "mongoose"
import {z} from "zod"

// refine -> custom validation 
export const taskIdSchema = z.object({
    id: z.string().refine(isValidObjectId, { message: "Invalid task id"}),
})