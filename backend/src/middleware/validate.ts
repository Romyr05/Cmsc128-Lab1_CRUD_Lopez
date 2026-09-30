import type { Request, Response, NextFunction } from "express";
import { z, ZodError, ZodType } from "zod";

// Turn a Zod error into a readable message + per-field errors for the frontend.
function formatError(error: ZodError) {
  return {
    message: error.issues.map((issue) => issue.message).join(", "),
    errors: z.flattenError(error).fieldErrors,
  };
}

// Validate req.body against a schema. Replaces req.body with the parsed
// (whitelisted + coerced) data so the controller can trust it.
export const validateBody =
  (schema: ZodType) => (req: Request, res: Response, next: NextFunction) => {
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json(formatError(parsed.error));
      return;
    }
    req.body = parsed.data;
    next();
  };

// Validate req.params against a schema.
// so we validate but don't reassign — the controller reads it directly.
export const validateParams =
  (schema: ZodType) => (req: Request, res: Response, next: NextFunction) => {
    const parsed = schema.safeParse(req.params);
    if (!parsed.success) {
      res.status(400).json(formatError(parsed.error));
      return;
    }
    next();
  };
