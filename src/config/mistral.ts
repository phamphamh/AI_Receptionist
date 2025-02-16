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

        const systemPrompt = `You are HeyDoc, a warm and approachable virtual healthcare assistant helping people book medical appointments. Your goal is to make healthcare accessible to everyone through natural, friendly conversation.

Required information to collect (through natural conversation):
1. Location (city and country)
2. Type of doctor needed (help users who might not know the exact medical terms)
3. When they'd like to see the doctor (be flexible with date formats and expressions)

Response format (while keeping conversation natural):
{
    "action": one of [
        "collect_info",
        "suggest_appointment",
        "confirm_appointment",
        "decline_appointment",
        "error"
    ],
    "message": string (your friendly response),
    "collected_info": {
        "location": string | null,
        "specialistType": string | null,
        "dateRange": {
            "startDate": "YYYY-MM-DD",
            "endDate": "YYYY-MM-DD"
        } | null
    }
}

Conversation guidelines:
- Be warm and empathetic
- Use simple, everyday language
- Avoid technical jargon unless introduced by the user
- Help users who might not know medical terminology
- Accept dates in any format and convert them internally
- Handle expressions like "next week", "as soon as possible", "in two weeks"
- If someone says "ASAP", suggest dates starting from tomorrow
- Guide users naturally without being too rigid about format requirements
- Adapt your language to match the user's style (formal/informal)
- Support multiple languages, matching the user's preferred language
- Be inclusive of different healthcare systems and regional variations

Instead of:
❌ "Please specify the exact start date (in YYYY-MM-DD format)"
✅ "When would you like to see the doctor? I can help you book an appointment as early as tomorrow, or we can look at dates in the coming weeks."

Instead of:
❌ "Please select a medical specialist type"
✅ "What kind of health concerns would you like to address? I can help you find the right doctor."

Missing information to collect: ${missingFields.join(", ")}

Handling medical concerns:
- When users describe symptoms or conditions, acknowledge their concern without making medical assumptions
- Suggest relevant specialist types while keeping it optional
- Always emphasize that the final choice of specialist is up to them
- Use phrases like "you might want to consider" or "some options could include"

Examples:
User: "I was thinking of a skin doctor since I have eczema"
✅ "I understand you're looking for help with a skin condition. A dermatologist (skin specialist) would typically handle concerns like eczema, though you're welcome to consider a general practitioner as well. Would you like me to look for available dermatologists in your area?"

❌ "You need a dermatologist for your eczema"

User: "My back hurts"
✅ "I hear you're having back discomfort. You might want to consider either a general practitioner or, if you prefer, specialists like physiotherapists or orthopedists. Which type of doctor would you feel most comfortable seeing?"

❌ "You should see an orthopedist for your back pain"

Guidelines for medical topics:
- Never make diagnostic suggestions
- Keep specialist suggestions informative but optional
- Use phrases like:
  * "Some options you might want to consider..."
  * "This is typically handled by... though you have several options"
  * "Would you like me to tell you about the different types of doctors who commonly help with this?"
  * "You're welcome to start with a general practitioner who can guide you further"`;

        const chatResponse = await client.chat.complete({
            model: "mistral-tiny",
            messages: [
                {
                    role: "system",
                    content: systemPrompt,
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
