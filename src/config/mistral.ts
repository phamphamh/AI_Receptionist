import dotenv from "dotenv";
import { Mistral } from "@mistralai/mistralai";
import { sessionManager } from "../lib/history";
import { findAvailableAppointment } from "../services/appointment.service";
import { AppointmentSearchResult } from "../services/appointment.service";

dotenv.config();

const MISTRAL_API_KEY = process.env.MISTRAL_API_KEY;

if (!MISTRAL_API_KEY) {
    throw new Error("Missing Mistral API configuration");
}

export const client = new Mistral({
    apiKey: MISTRAL_API_KEY,
});

interface AIResponse {
    action:
        | "collect_info"
        | "suggest_appointment"
        | "confirm_appointment"
        | "decline_appointment"
        | "error";
    message: string;
    collected_info?: {
        location?: string;
        specialistType?: string;
        dateRange?: {
            startDate: string;
            endDate: string;
        };
    };
    suggested_appointment?: {
        doctorName: string;
        location: string;
        datetime: string;
        specialistType: string;
    };
}

interface AppointmentContext {
    searchResult: AppointmentSearchResult;
    userLanguage: string;
}

export const getMistralResponse = async (
    from: string,
    message: string
): Promise<AIResponse> => {
    try {
        const session = sessionManager.getActiveSession(from);
        const missingFields = sessionManager.getMissingFields(from);

        const chatResponse = await client.chat.complete({
            model: "mistral-tiny",
            messages: [
                {
                    role: "system",
                    content: `You are HeyDoc, a professional and friendly virtual healthcare assistant specialized in booking medical appointments.

Required information to collect:
1. Location (to find the closest medical facility)
2. Medical specialist type (dermatologist, allergologist, venereologist, general practitioner, etc.)
3. Date range (starting from today: ${new Date().toISOString().split("T")[0]})

Current missing information: ${missingFields.join(", ")}

Conversation flow:
1. If this is a new conversation, explain the booking process
2. Collect missing information one by one or all at once if provided
3. Once all information is collected, suggest an appointment

IMPORTANT: You must respond with valid, properly escaped JSON.

Example response format:
{
    "action": "collect_info",
    "message": "Hello! I can help you book a medical appointment. What type of specialist would you like to see?",
    "collected_info": {
        "location": null,
        "specialistType": null,
        "dateRange": null
    }
}

Guidelines:
- Be friendly and professional
- Handle both structured and unstructured inputs
- Extract information from casual language
- If user says "as soon as possible", set dateRange.startDate to today and endDate to 30 days later
- Support multiple languages (English, French, etc.) and use the language of the user
- If information is unclear, ask for clarification
- Confirm understanding when information is provided
- Keep responses concise but helpful
- Focus on collecting missing information: ${missingFields.join(", ")}
- If all information is collected, suggest an appointment`,
                },
                ...(session?.messages.map((msg) => ({
                    role: "user" as const,
                    content: msg.content,
                })) || []),
                { role: "user", content: message },
            ],
            responseFormat: { type: "json_object" },
            temperature: 0.7,
            maxTokens: 250,
        });

        let response: AIResponse;

        try {
            const content = chatResponse.choices![0].message.content;
            if (typeof content !== "string") {
                throw new Error("Invalid response format from Mistral API");
            }

            response = JSON.parse(content.trim());

            // Validate response structure
            if (!response.action || !response.message) {
                throw new Error("Invalid response structure");
            }
        } catch (parseError) {
            console.error("JSON Parse Error:", parseError);
            console.error(
                "Raw content:",
                chatResponse.choices![0].message.content
            );
            return {
                action: "error",
                message:
                    "I apologize, I'm having trouble understanding. Could you please repeat that?",
            };
        }

        if (response.collected_info) {
            sessionManager.updateAppointmentInfo(from, {
                ...response.collected_info,
            });
        }

        if (
            response.action === "suggest_appointment" &&
            session?.appointmentInfo.location &&
            session?.appointmentInfo.specialistType &&
            session?.appointmentInfo.dateRange
        ) {
            const appointmentResult = await findAvailableAppointment(
                from,
                session.appointmentInfo.location,
                session.appointmentInfo.specialistType,
                session.appointmentInfo.dateRange.startDate
            );

            if (appointmentResult.success && appointmentResult.doctor) {
                response.suggested_appointment = {
                    doctorName: appointmentResult.doctor.name,
                    location:
                        appointmentResult.location ||
                        appointmentResult.doctor.city,
                    datetime: appointmentResult.datetime!,
                    specialistType: appointmentResult.doctor.specialty,
                };

                // Let Mistral generate the appropriate message based on the appointment context
                const appointmentContext: AppointmentContext = {
                    searchResult: appointmentResult,
                    userLanguage: "fr-FR", // You could detect this from user messages
                };

                const contextMessage = await client.chat.complete({
                    model: "mistral-tiny",
                    messages: [
                        {
                            role: "system",
                            content: `You are helping to format an appointment suggestion message.
                            The message should be friendly and professional.
                            For teleconsultations, emphasize that it's a video consultation.
                            For nearby cities, mention that it's in a different city but still accessible.
                            Ask if the user would like to book the appointment.
                            Use the user's language (${appointmentContext.userLanguage}).`,
                        },
                        {
                            role: "user",
                            content: JSON.stringify(appointmentContext),
                        },
                    ],
                    temperature: 0.7,
                    maxTokens: 150,
                });

                response.message =
                    contextMessage.choices?.[0]?.message?.content?.toString() ||
                    "No response generated.";
            } else {
                response.action = "collect_info";

                // Let Mistral generate the "no appointments found" message
                const noAppointmentMessage = await client.chat.complete({
                    model: "mistral-tiny",
                    messages: [
                        {
                            role: "system",
                            content: `Generate a friendly message explaining that no appointments were found.
                            Suggest trying different dates or locations.
                            Use the user's language (${session.messages[0].content.slice(
                                0,
                                50
                            )}).`,
                        },
                        {
                            role: "user",
                            content: JSON.stringify({
                                location: session.appointmentInfo.location,
                                specialistType:
                                    session.appointmentInfo.specialistType,
                                dateRange: session.appointmentInfo.dateRange,
                            }),
                        },
                    ],
                    temperature: 0.7,
                    maxTokens: 150,
                });

                response.message =
                    noAppointmentMessage.choices?.[0]?.message?.content?.toString() ||
                    "No appointments found.";
            }
        }

        return response;
    } catch (error) {
        console.error("Error calling Mistral API:", error);
        return {
            action: "error",
            message:
                "I apologize, I'm experiencing technical difficulties. Please try again later.",
        };
    }
};

const prompt = `
Todays date is ${new Date().toLocaleString()}
Hello there! I'm HeyDoc, your virtual healthcare assistant. How can I help you today?`;
