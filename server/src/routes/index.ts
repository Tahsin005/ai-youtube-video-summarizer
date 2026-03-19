import { Router } from "express";
import healthRoutes from "./health.routes.js";
import authRoutes from "./auth.routes.js";
import videoRoutes from "./video.routes.js";
import { authenticate } from "../middleware/auth.middleware.js";

const router: Router = Router();

router.use("/health", healthRoutes);
router.use("/auth", authRoutes);

router.use("/videos", authenticate,videoRoutes);
export default router;