import { Mistral } from "@mistralai/mistralai";
import dotenv from "dotenv";
import { sessionManager } from "../lib/history";
import { findAvailableTimeSlots } from "../services/appointment.service";

dotenv.config();

const MISTRAL_API_KEY = process.env.MISTRAL_API_KEY;
if (!MISTRAL_API_KEY) {
    throw new Error("Missing Mistral API configuration");
}

export const client = new Mistral({ apiKey: MISTRAL_API_KEY });

interface AIResponse {
    message: string;
    extractedInfo?: {
        specialistType?: string;
        location?: string;
        date?: string;
        timeSlot?: {
            start: number;
            end: number;
        };
    };
}

const QUESTIONS: Record<string, string> = {
    specialistType: "What type of doctor would you like to see?",
    location: "In which city would you like to book the appointment?",
    date: "What date would you prefer? (You can say things like 'next Monday' or 'tomorrow')",
    timeSlot:
        "What time of day would you prefer? (For example: 'morning', '2pm to 6pm')",
};

export const getMistralResponse = async (
    userId: string,
    message: string
): Promise<AIResponse> => {
    try {
        let session = sessionManager.getSession(userId);
        if (!session) {
            session = sessionManager.startNewSession(userId);
            return {
                message:
                    "Hello! I'll help you book a medical appointment. " +
                    QUESTIONS.specialistType,
            };
        }

        const currentField = session.appointmentInfo.nextField;
        if (!currentField) {
            return {
                message:
                    "I'm sorry, something went wrong. Let's start over. " +
                    QUESTIONS.specialistType,
            };
        }

        if (currentField === "complete") {
            // All information collected, search for appointments
            const { specialistType, location, date, timeSlot } =
                session.appointmentInfo;
            if (!specialistType || !location || !date || !timeSlot) {
                return {
                    message:
                        "I'm sorry, but some information is missing. Let's start over. " +
                        QUESTIONS.specialistType,
                };
            }

            const availableSlots = findAvailableTimeSlots(
                specialistType,
                location,
                timeSlot,
                date,
                3
            );

            if (availableSlots.length > 0) {
                const formattedSlots = availableSlots.map((slot, index) => {
                    const date = new Date(slot.datetime);
                    return `${index + 1}. Dr. ${slot.doctor.name} in ${
                        slot.location
                    } on ${date.toLocaleString("fr-FR", {
                        weekday: "long",
                        month: "long",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                    })}`;
                });

                sessionManager.endSession(userId);
                return {
                    message: `Great! I found ${
                        availableSlots.length
                    } available appointments:\n\n${formattedSlots.join(
                        "\n"
                    )}\n\nTo book one of these appointments, please reply with the number (1-${
                        formattedSlots.length
                    }).`,
                };
            } else {
                sessionManager.endSession(userId);
                return {
                    message:
                        "I'm sorry, but I couldn't find any available appointments matching your criteria. Would you like to try different dates or times?",
                };
            }
        }

        // Extract information based on current field
        const extractPrompt = `Extract ONLY the following information from the user's message for booking a medical appointment.
For the current field "${currentField}", provide the response in this exact JSON format:
{
    "specialistType": "exact medical specialist mentioned (e.g., 'dermatologist') or null",
    "location": "exact city mentioned (e.g., 'Paris 18eme') or null",
    "date": "exact date mentioned (e.g., 'next monday', 'tomorrow') or null",
    "timeSlot": {
        "start": number (hour in 24h format),
        "end": number (hour in 24h format)
    } or null
}
Focus ONLY on the current field, set others to null. Be strict about extracting EXACTLY what the user said.`;

        const extractResponse = await client.chat.complete({
            model: "mistral-tiny",
            messages: [
                { role: "system", content: extractPrompt },
                { role: "user", content: message },
            ],
            temperature: 0.3,
            maxTokens: 150,
        });

        try {
            const content = extractResponse.choices?.[0]?.message?.content;
            if (typeof content !== "string") {
                throw new Error("Invalid response format");
            }

            const extractedInfo = JSON.parse(content.trim());
            const fieldValue = extractedInfo[currentField];

            if (fieldValue) {
                // Update session with extracted information
                sessionManager.updateSession(userId, {
                    [currentField]: fieldValue,
                });

                // Get next question based on updated session
                const updatedSession = sessionManager.getSession(userId);
                if (
                    !updatedSession ||
                    !updatedSession.appointmentInfo.nextField
                ) {
                    throw new Error("Session not found or invalid");
                }

                const nextField = updatedSession.appointmentInfo.nextField;
                if (nextField === "complete") {
                    // Trigger appointment search
                    return await getMistralResponse(userId, "");
                }

                return {
                    message: `Got it! ${QUESTIONS[nextField]}`,
                    extractedInfo: { [currentField]: fieldValue },
                };
            }

            return {
                message: `I didn't quite catch that. ${QUESTIONS[currentField]}`,
            };
        } catch (error) {
            console.error("Error processing response:", error);
            return {
                message: `I'm having trouble understanding. ${QUESTIONS[currentField]}`,
            };
        }
    } catch (error) {
        console.error("Error in getMistralResponse:", error);
        return {
            message:
                "I apologize, I'm experiencing technical difficulties. Please try again.",
        };
    }
};
