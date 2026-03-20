import { Router } from "express";
import { VideoController } from "../controllers/video.controller.js";
import { validateUrl } from "../middleware/validateUrl.middleware.js";

const router: Router = Router();

router.post("/info", validateUrl, VideoController.getVideoInfo);
router.post("/audio", validateUrl, VideoController.downloadAudio);
router.post("/transcribe", validateUrl, VideoController.transcribeVideo);

export default router;