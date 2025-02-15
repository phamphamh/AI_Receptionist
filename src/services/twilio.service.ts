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

        const message = await twilioClient.messages.create({
            body: aiResponse.message,
            from: To,
            to: From,
        });

        console.log("Message sent successfully:", message.sid);

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
