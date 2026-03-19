import { Router } from "express";
import { AuthController } from "../controllers/auth.controllers.js";

const router: Router = Router();

router.post("/register", AuthController.register);

export default router;