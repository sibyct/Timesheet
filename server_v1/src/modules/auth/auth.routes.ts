import { Router } from "express";
import { register, login } from "./auth.controller";
import { validate } from "../../middleware/validator.middleware";
import { registerSchema, loginSchema } from "./auth.validator";

const router = Router();

router.post("/register", validate(registerSchema), register);
router.post("/login", validate(loginSchema), login);

export default router;