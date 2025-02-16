import { twilioClient } from "../config/twilio";
import { getMistralResponse } from "../config/mistral";
import { sessionManager } from "../lib/history";

export const handleMessage = async (
    messageBody: string,
    From: string,
    To: string
): Promise<string> => {
    try {
        if (!sessionManager.hasActiveSession(From)) {
            sessionManager.startNewSession(From);
        }

        sessionManager.addMessage(From, messageBody, "user");

        const aiResponse = await getMistralResponse(From, messageBody);

        sessionManager.addMessage(From, aiResponse.message, "bot");

        if (
            aiResponse.action === "suggest_appointment" &&
            aiResponse.suggested_appointment
        ) {
            await twilioClient.messages.create({
                body: aiResponse.message,
                persistentAction: [
                    `geo:48.8584,2.2945|${aiResponse.suggested_appointment.location}`,
                ],
                from: To,
                to: From,
            });

            const appointmentDate = new Date(
                aiResponse.suggested_appointment.datetime
            ).toLocaleString("en-US", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
            });

            await twilioClient.messages.create({
                contentSid: "HX7dba1e0e532b799f99d4bd895c9b56a0",
                contentVariables: JSON.stringify({
                    1: aiResponse.suggested_appointment.doctorName,
                    2: appointmentDate,
                }),
                from: To,
                to: From,
            });
        } else {
            await twilioClient.messages.create({
                body: aiResponse.message,
                from: To,
                to: From,
            });
        }

        if (
            aiResponse.action === "confirm_appointment" &&
            aiResponse.suggested_appointment
        ) {
            sessionManager.confirmAppointment(From, {
                doctorName: aiResponse.suggested_appointment.doctorName,
                location: aiResponse.suggested_appointment.location,
                datetime: new Date(aiResponse.suggested_appointment.datetime),
                specialistType: aiResponse.suggested_appointment.specialistType,
            });
        } else if (aiResponse.action === "decline_appointment") {
            sessionManager.endSession(From);
        }

        return "Message processed successfully";
    } catch (error) {
        console.error("Error sending message:", error);
        throw error;
    }
};
