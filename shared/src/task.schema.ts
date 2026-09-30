import { z } from "zod";

// Exported as plain arrays so the frontend can build dropdowns from the SAME source of truth.
export const priorities = ["low", "medium", "high"] as const;
export const tags = ["curricular", "extra-curricular", "home"] as const;

export const prioritySchema = z.enum(priorities);
export const tagSchema = z.enum(tags);

// A due date must be at least 1 day from now.
function isAtLeastOneDayAway(date: Date): boolean {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  return date >= tomorrow;
}

// The fields a client may send. Shared by create (required) and update (partial).
const taskShape = z.object({
  title: z.string().trim().min(1, "Title is required"),
  priority: prioritySchema,
  due_date: z.coerce.date().optional(),
  tag: tagSchema.optional(),
  description: z.string().trim().optional(),
  completed: z.boolean().optional(),
});

const dueDateIsValid = (data: { due_date?: Date }) =>
  !data.due_date || isAtLeastOneDayAway(data.due_date);
const dueDateError = { message: "Due date must be at least 1 day from now", path: ["due_date"] };

// POST /api/tasks — title & priority required.
export const createTaskSchema = taskShape.refine(dueDateIsValid, dueDateError);

// PUT /api/tasks/:id — any subset of fields (.partial() makes every field optional).
export const updateTaskSchema = taskShape.partial().refine(dueDateIsValid, dueDateError);

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
