import { Request, Response } from "express";
import { twilioClient } from "../config/twilio";
import { getMistralResponse } from "../config/mistral";
import { sessionManager } from "../lib/history";

export const handleIncomingMessage = async (req: Request, res: Response) => {
    try {
        const { Body, From, To } = req.body;

        // Get or create session using phone number as ID
        let session = sessionManager.getSessionByPhoneNumber(From);
        if (!session) {
            session = sessionManager.startNewSession(From, From);
        }

        // Add user message to session
        sessionManager.addMessage(session.userId, Body, "user");

        // Get AI response
        const response = await getMistralResponse(session.userId, Body);

        // Add bot message to session
        sessionManager.addMessage(session.userId, response.message, "bot");

        // Send response via Twilio
        if (process.env.TWILIO_PHONE_NUMBER) {
            await twilioClient.messages.create({
                body: response.message,
                from: To,
                to: From,
            });
        } else {
            throw new Error(
                "TWILIO_PHONE_NUMBER environment variable is not set"
            );
        }

        res.status(200).send("Message processed successfully");
    } catch (error) {
        console.error("Error processing message:", error);
        res.status(500).send("Internal server error");
    }
};
