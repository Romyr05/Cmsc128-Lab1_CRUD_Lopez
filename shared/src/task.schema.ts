import { z } from "zod";

// Exported as plain arrays so the frontend can build dropdowns from the SAME source of truth.
export const priorities = ["low", "medium", "high"] as const;
export const tags = ["curricular", "extra-curricular", "home"] as const;
export const TITLE_MAX_LENGTH = 200;

export const prioritySchema = z.enum(priorities);
export const tagSchema = z.enum(tags);


// POST /api/tasks — title & priority required.
export const createTaskSchema = z.object({
  title:z
  .string()
  .trim()
  .min(1, "Title is required")
  .max(TITLE_MAX_LENGTH, `Title must be at most ${TITLE_MAX_LENGTH}`),
  priority: prioritySchema,
  due_date: z.coerce.date().optional(),
  tag:tagSchema.optional(),
  description: z.string().trim().optional(),
  completed: z.boolean().optional(),

});

// PUT /api/tasks/:id — any subset of fields (.partial() makes every field optional).
export const updateTaskSchema = createTaskSchema.partial()

export type CreateTaskInput = z.infer<typeof createTaskSchema>;
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>;

// The full task as it comes back from the API (dates are ISO strings over the wire).
export const taskSchema = z.object({
  _id: z.string(),
  title: z.string(),
  completed: z.boolean(),
  due_date: z.string().optional(),
  priority: prioritySchema,
  tag: tagSchema.optional(),
  description: z.string().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type Task = z.infer<typeof taskSchema>;
