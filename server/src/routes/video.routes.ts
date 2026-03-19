import { Router } from "express";
import { VideoController } from "../controllers/video.controller.js";
import { validateUrl } from "../middleware/validateUrl.js";

const router: Router = Router();

router.get("/info", validateUrl, VideoController.getVideoInfo);

export default router;