import { Router } from "express";
import { login, me, register, searchUsers } from "../controllers/authController.js";
import { requireAuth } from "../middleware/auth.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { authSchemas, validate } from "../validators/schemas.js";

export const authRoutes = Router();

authRoutes.post("/register", validate(authSchemas.register), asyncHandler(register));
authRoutes.post("/login", validate(authSchemas.login), asyncHandler(login));
authRoutes.get("/me", requireAuth, asyncHandler(me));
authRoutes.get("/users", requireAuth, asyncHandler(searchUsers));
