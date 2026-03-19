import { Router } from "express";
import { AuthController } from "../controllers/auth.controllers.js";

const router: Router = Router();

router.post("/register", AuthController.register);
router.post("/login", AuthController.login);
router.get("/verify-email", AuthController.verifyEmail);
router.post("/resend-verification", AuthController.resendVerificationEmail);

export default router;