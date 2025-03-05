import express from "express";
import { register, login, getProfile } from "../controllers/authController.js";
import protect from "../middleware/authMiddleware.js"; // Import the middleware

const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.get("/profile", protect, getProfile); // Protected route

export default router;
