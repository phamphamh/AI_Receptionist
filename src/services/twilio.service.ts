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

        sessionManager.addMessage(From, aiResponse.message, "bot");

        // Handle appointment confirmation
        if (
            aiResponse.action === "confirm_appointment" &&
            aiResponse.suggested_appointment
        ) {
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

                // Get AI-generated confirmation message
                const confirmationMessage = await client.chat.complete({
                    model: "mistral-tiny",
                    messages: [
                        {
                            role: "system",
                            content:
                                "Generate a friendly appointment confirmation message. Include all appointment details and remind the patient to arrive 10 minutes early.",
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

                await twilioClient.messages.create({
                    body:
                        confirmationMessage.choices?.[0]?.message?.content?.toString() ||
                        "Appointment confirmed.",
                    from: To,
                    to: From,
                });
            } else {
                // Let AI generate the error message
                const errorMessage = await client.chat.complete({
                    model: "mistral-tiny",
                    messages: [
                        {
                            role: "system",
                            content:
                                "Generate a polite message explaining that the time slot is no longer available and offer to find another appointment.",
                        },
                    ],
                    temperature: 0.7,
                    maxTokens: 100,
                });

                await twilioClient.messages.create({
                    body:
                        errorMessage.choices?.[0]?.message?.content?.toString() ||
                        "Time slot no longer available.",
                    from: To,
                    to: From,
                });
            }
        } else {
            // Send regular response
            await twilioClient.messages.create({
                body: aiResponse.message,
                from: To,
                to: From,
            });
        }

        if (aiResponse.action === "decline_appointment") {
            sessionManager.endSession(From);
        }

        return "Message processed successfully";
    } catch (error) {
        console.error("Error sending message:", error);
        throw error;
    }
};
