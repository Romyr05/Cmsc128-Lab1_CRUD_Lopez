import { z } from "zod";
import { isValidObjectId } from "mongoose";
import { Role_Enum } from "./list.schema.js";

// Request validation for /api/lists (the Mongoose shape lives in list.schema.ts)

const objectId = (label: string) =>
  z.string().refine(isValidObjectId, { message: `Invalid ${label}` });

// POST /api/lists — just the list name.
export const createListSchema = z.object({
  name: z.string().trim().min(1, "List name is required").max(100, "List name is too long"),
});

// POST /api/lists/:id/members — who to add and what they can do.
export const addMemberSchema = z.object({
  email: z.email("Invalid email").trim(),
  role: z.enum(Role_Enum),
});

// PATCH /api/lists/:id/members/:userId — the new role.
export const updateRoleSchema = z.object({
  role: z.enum(Role_Enum),
});

// :id
export const listIdParamsSchema = z.object({
  id: objectId("list id"),
});

// :id + :userId
export const memberParamsSchema = z.object({
  id: objectId("list id"),
  userId: objectId("user id"),
});
