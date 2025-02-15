import { Request, Response } from "express";
import { getMistralResponse } from "../config/mistral";
import { sessionManager } from "../lib/history";

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
