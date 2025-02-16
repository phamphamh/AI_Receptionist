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
        const { message, userId, wantsSpeech } = req.body;
        console.log("\n=== New Message Request ===");
        console.log("User ID:", userId);
        console.log("Message:", message);
        console.log("Wants Speech:", wantsSpeech);

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
        console.log("AI Response:", aiResponse.message);

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

        let speechData: string | null = null;
        /*
        if (wantsSpeech) {
            try {
                console.log("\n=== Generating Speech ===");
                console.log("Text to convert:", aiResponse.message);

                const audioBuffer = await textToSpeech(aiResponse.message);
                const fileName = `${crypto.randomUUID()}.mp3`;
                const tempDir = path.join(__dirname, "../../temp");
                const filePath = path.join(tempDir, fileName);

                if (!fs.existsSync(tempDir)) {
                    fs.mkdirSync(tempDir, { recursive: true });
                }

                await fs.promises.writeFile(filePath, audioBuffer);
                speechData = fileName;
            } catch (speechError) {
                console.error("\n=== Speech Generation Error ===");
                console.error("Error details:", speechError);
            }
        }
        */

        console.log("\n=== Sending Response ===");
        console.log("Speech data:", speechData);

        return res.status(200).json({
            message: aiResponse.message,
            action: aiResponse.action,
            suggested_appointment: aiResponse.suggested_appointment,
            speechFile: speechData,
        });
    } catch (error) {
        console.error("\n=== Request Error ===");
        console.error("Error details:", error);
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

export const textToSpeech = async (text: string): Promise<Buffer> => {
    try {
        console.log("\n=== Text to Speech Request ===");
        console.log("Input text:", text);

        const mp3 = await openai.audio.speech.create({
            model: "tts-1",
            voice: "alloy",
            input: text,
        });

        const buffer = Buffer.from(await mp3.arrayBuffer());
        console.log("Generated audio size:", buffer.length, "bytes");

        return buffer;
    } catch (error) {
        console.error("\n=== Text to Speech Error ===");
        console.error("Error details:", error);
        throw error;
    }
};

export const getAudioFile = async (req: Request, res: Response) => {
    try {
        const { fileName } = req.params;
        console.log("\n=== Audio File Request ===");
        console.log("Requested file:", fileName);

        const filePath = path.join(__dirname, "../../temp", fileName);
        console.log("Full path:", filePath);

        if (!fs.existsSync(filePath)) {
            console.log("File not found!");
            return res.status(404).json({ error: "Audio file not found" });
        }

        const stat = fs.statSync(filePath);
        console.log("File stats:", {
            size: stat.size,
            created: stat.birthtime,
            modified: stat.mtime,
        });

        res.writeHead(200, {
            "Content-Type": "audio/mpeg",
            "Content-Length": stat.size,
            "Accept-Ranges": "bytes",
        });
        console.log("Headers set");

        const fileStream = fs.createReadStream(filePath);
        console.log("File stream created");

        fileStream.on("open", () => {
            console.log("Stream opened");
        });

        fileStream.on("data", (chunk) => {
            console.log("Streaming chunk:", chunk.length, "bytes");
        });

        fileStream.on("end", () => {
            console.log("Stream ended");
            fs.unlink(filePath, (err) => {
                if (err) {
                    console.error("Error deleting file:", err);
                } else {
                    console.log("File deleted successfully");
                }
            });
        });

        fileStream.on("error", (error) => {
            console.error("Stream error:", error);
            if (!res.headersSent) {
                res.status(500).json({ error: "Error streaming audio file" });
            }
        });

        fileStream.pipe(res);
    } catch (error) {
        console.error("\n=== Audio Serving Error ===");
        console.error("Error details:", error);
        if (!res.headersSent) {
            res.status(500).json({ error: "Internal server error" });
        }
    }
};
