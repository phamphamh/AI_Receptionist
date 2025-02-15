import { Request, Response } from "express";
import { getMistralResponse } from "../config/mistral";
import { sessionManager } from "../lib/history";
import OpenAI from "openai";
import { FileArray, UploadedFile } from "express-fileupload";
import fs from "fs";
import path from "path";

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

export const handleDirectMessage = async (req: Request, res: Response) => {
    try {
        const { message, userId } = req.body;

        if (!message || !userId) {
            return res.status(400).json({
                error: "Missing required fields: message and userId",
            });
        }

        if (!sessionManager.hasActiveSession(userId)) {
            sessionManager.startNewSession(userId);
        }

        sessionManager.addMessage(userId, message, "user");

        const aiResponse = await getMistralResponse(userId, message);

        sessionManager.addMessage(userId, aiResponse.message, "bot");

        if (
            aiResponse.action === "confirm_appointment" &&
            aiResponse.suggested_appointment
        ) {
            sessionManager.confirmAppointment(userId, {
                doctorName: aiResponse.suggested_appointment.doctorName,
                location: aiResponse.suggested_appointment.location,
                datetime: new Date(aiResponse.suggested_appointment.datetime),
                specialistType: aiResponse.suggested_appointment.specialistType,
            });
        } else if (aiResponse.action === "decline_appointment") {
            sessionManager.endSession(userId);
        }

        return res.status(200).json({
            message: aiResponse.message,
            action: aiResponse.action,
            suggested_appointment: aiResponse.suggested_appointment,
        });
    } catch (error) {
        console.error("Error processing direct message:", error);
        return res.status(500).json({ error: "Internal server error" });
    }
};

export const handleAudioMessage = async (req: Request, res: Response) => {
    try {
        const { userId } = req.body;
        const files = req.files as FileArray;

        if (!userId) {
            return res.status(400).json({
                error: "Missing required field: userId",
            });
        }

        if (!files || !files.audio) {
            return res.status(400).json({
                error: "No audio file uploaded",
            });
        }

        const audioFile = files.audio as UploadedFile;

        if (!audioFile.mimetype.startsWith("audio/")) {
            return res.status(400).json({
                error: "Invalid file type. Please upload an audio file.",
            });
        }

        const tempDir = path.join(__dirname, "../../temp");
        if (!fs.existsSync(tempDir)) {
            fs.mkdirSync(tempDir, { recursive: true });
        }

        const tempFilePath = path.join(
            tempDir,
            `${Date.now()}_${audioFile.name}`
        );
        await audioFile.mv(tempFilePath);

        try {
            const transcription = await openai.audio.transcriptions.create({
                file: fs.createReadStream(tempFilePath),
                model: "whisper-1",
            });

            fs.unlinkSync(tempFilePath);

            const aiResponse = await getMistralResponse(
                userId,
                transcription.text
            );

            if (!sessionManager.hasActiveSession(userId)) {
                sessionManager.startNewSession(userId);
            }

            sessionManager.addMessage(userId, transcription.text, "user");
            sessionManager.addMessage(userId, aiResponse.message, "bot");

            if (
                aiResponse.action === "confirm_appointment" &&
                aiResponse.suggested_appointment
            ) {
                sessionManager.confirmAppointment(userId, {
                    doctorName: aiResponse.suggested_appointment.doctorName,
                    location: aiResponse.suggested_appointment.location,
                    datetime: new Date(
                        aiResponse.suggested_appointment.datetime
                    ),
                    specialistType:
                        aiResponse.suggested_appointment.specialistType,
                });
            } else if (aiResponse.action === "decline_appointment") {
                sessionManager.endSession(userId);
            }

            return res.status(200).json({
                transcription: transcription.text,
                message: aiResponse.message,
                action: aiResponse.action,
                suggested_appointment: aiResponse.suggested_appointment,
            });
        } catch (error) {
            if (fs.existsSync(tempFilePath)) {
                fs.unlinkSync(tempFilePath);
            }
            throw error;
        }
    } catch (error) {
        console.error("Error processing audio message:", error);
        return res.status(500).json({ error: "Internal server error" });
    }
};
