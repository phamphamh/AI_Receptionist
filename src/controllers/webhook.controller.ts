import { Request, Response } from "express";
import { twilioClient } from "../config/twilio";
import { getMistralResponse } from "../config/mistral";

export const handleIncomingMessage = async (req: Request, res: Response) => {
    try {
        const { Body, From } = req.body;

        // Get AI response
        const response = await getMistralResponse(From, Body);

        // Send response via Twilio
        await twilioClient.messages.create({
            body: response.message,
            from: process.env.TWILIO_PHONE_NUMBER,
            to: From,
        });

        res.status(200).send("Message processed successfully");
    } catch (error) {
        console.error("Error processing message:", error);
        res.status(500).send("Internal server error");
    }
};
