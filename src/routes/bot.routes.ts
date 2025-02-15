import express from "express";
import { handleDirectMessage } from "../controllers/bot.controller";

const router = express.Router();

router.post("/chat", handleDirectMessage);

export default router;
