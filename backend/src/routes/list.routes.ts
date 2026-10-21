import { Router } from "express";

import { getLists, createList, addMember, updateMemberRole, removeMember } from "../controllers/list.controller.js";
import { validateBody, validateParams } from "../middleware/validate.js";
import { checkAuth } from "../middleware/requireAuth.js";
import { createListSchema, addMemberSchema, updateRoleSchema, listIdParamsSchema, memberParamsSchema } from "../schemas/listInput.schema.js";

const router = Router()

router.use(checkAuth) // every list route requires a logged-in session (401 otherwise)

router.get("/", getLists)
router.post("/", validateBody(createListSchema), createList)
router.post("/:id/members", validateParams(listIdParamsSchema), validateBody(addMemberSchema), addMember)
router.patch("/:id/members/:userId", validateParams(memberParamsSchema), validateBody(updateRoleSchema), updateMemberRole)
router.delete("/:id/members/:userId", validateParams(memberParamsSchema), removeMember)

export default router
