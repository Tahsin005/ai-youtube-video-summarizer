import { Router } from "express";
import { successResponse } from "../utils/response.js";
import { environment } from "../config/env.js";

const router: Router = Router();

router.get("/", (req, res) => {
    res.json(successResponse({ 
        status: "ok",
        timestamp: new Date().toISOString(),
        environment: environment.NODE_ENV,
    }));
});

export default router;