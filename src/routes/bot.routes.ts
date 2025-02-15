import express from "express";
import fileUpload from "express-fileupload";
import {
    handleDirectMessage,
    handleAudioMessage,
} from "../controllers/bot.controller";

const router = express.Router();

router.use(
    fileUpload({
        limits: { fileSize: 10 * 1024 * 1024 },
        abortOnLimit: true,
        createParentPath: true,
    })
);

router.post("/message", handleDirectMessage);
router.post("/audio", handleAudioMessage);

export default router;
