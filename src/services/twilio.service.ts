import { twilioClient } from "../config/twilio";
import { getMistralResponse } from "../config/mistral";
import { sessionManager } from "../lib/history";
import { checkDoctorAvailability } from "../requests/appointmentService";
import { client } from "../config/mistral";

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

        switch (aiResponse.action) {
            case "confirm_appointment": {
                if (!aiResponse.suggested_appointment) {
                    throw new Error(
                        "No appointment details found for confirmation"
                    );
                }

                const { doctorName, location, datetime, specialistType } =
                    aiResponse.suggested_appointment;

                const availabilityCheck = await checkDoctorAvailability(
                    From,
                    doctorName,
                    location,
                    datetime,
                    specialistType
                );

                if (availabilityCheck.success) {
                    sessionManager.confirmAppointment(From, {
                        doctorName,
                        location,
                        datetime: new Date(datetime),
                        specialistType,
                    });

                    const confirmationMessage = await client.chat.complete({
                        model: "mistral-tiny",
                        messages: [
                            {
                                role: "system",
                                content:
                                    "Generate a friendly appointment confirmation message with all details and arrival instructions.",
                            },
                            {
                                role: "user",
                                content: JSON.stringify({
                                    doctor: doctorName,
                                    location,
                                    datetime,
                                    specialty: specialistType,
                                }),
                            },
                        ],
                        temperature: 0.7,
                        maxTokens: 150,
                    });

                    aiResponse.message =
                        confirmationMessage.choices?.[0]?.message?.content?.toString() ||
                        `Appointment confirmed with Dr. ${doctorName} on ${new Date(
                            datetime
                        ).toLocaleString()}`;
                } else {
                    aiResponse.action = "collect_info";
                    aiResponse.message =
                        "I apologize, but this time slot is no longer available. Let me help you find another appointment.";
                }
                break;
            }

            case "decline_appointment":
                sessionManager.endSession(From);
                break;

            case "error":
                console.error("AI Response Error:", aiResponse.message);
                break;
        }

        sessionManager.addMessage(From, aiResponse.message, "bot");

        await twilioClient.messages.create({
            body: aiResponse.message,
            from: To,
            to: From,
        });

        return "Message processed successfully";
    } catch (error) {
        console.error("Error in handleMessage:", error);

        await twilioClient.messages.create({
            body: "I apologize, but I'm having trouble processing your request. Please try again.",
            from: To,
            to: From,
        });

        throw error;
    }
};
