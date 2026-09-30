import { z } from "zod";
import { createTaskSchema, tags } from "shared";

// title length, priority enum are reused from the shared
// schema so the frontend and backend validate identically.
export const taskFormSchema = z.object({
  title: createTaskSchema.shape.title,
  priority: createTaskSchema.shape.priority,
  tag: z.enum([...tags, "none"]),
  due_date: z.string(),
  description: z.string(),
  completed: z.boolean(),
});

export type TaskFormValues = z.infer<typeof taskFormSchema>;


export function toPayload(v: TaskFormValues) {
  return {
    title: v.title,
    description: v.description.trim(), // always send (empty string clears it)
    due_date: v.due_date || undefined,
    priority: v.priority,
    tag: v.tag === "none" ? undefined : v.tag,
    completed: v.completed,
  };
}
