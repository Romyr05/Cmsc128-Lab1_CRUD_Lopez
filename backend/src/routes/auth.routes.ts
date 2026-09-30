import { Router } from "express";

import { register, login, me, logout, forgotPassword, resetPassword } from "../controllers/auth.controller.js";
import { validateBody } from "../middleware/validate.js";
import { registerSchema, loginSchema, forgotPasswordSchema, resetPasswordSchema } from "../schemas/auth.schema.js";
import { checkAuth } from "../middleware/requireAuth.js";

const router = Router()

router.post("/register", validateBody(registerSchema), register)
router.post("/login", validateBody(loginSchema), login)
router.post("/forgot-password", validateBody(forgotPasswordSchema), forgotPassword)
router.post("/reset-password", validateBody(resetPasswordSchema), resetPassword)
router.get("/me", me)
router.post("/logout", checkAuth, logout)

export default router
