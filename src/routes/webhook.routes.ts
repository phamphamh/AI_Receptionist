import { Router } from "express";
import { handleIncomingMessage } from "../controllers/webhook.controller";

const router = Router();

// Route pour les messages SMS entrants
router.post("/sms", handleIncomingMessage);

export default router;
