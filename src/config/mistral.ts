import dotenv from "dotenv";
import { Mistral } from "@mistralai/mistralai";
import { sessionManager } from "../lib/history";

dotenv.config();

const MISTRAL_API_KEY = process.env.MISTRAL_API_KEY;

if (!MISTRAL_API_KEY) {
    throw new Error("Missing Mistral API configuration");
}

const client = new Mistral({
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

When suggesting appointments, generate culturally appropriate doctor names based on the user's location:
- For French locations: Generate French names (e.g., Dubois, Laurent, Petit)
- For Italian locations: Generate Italian names (e.g., Rossi, Ferrari, Conti)
- For Spanish locations: Generate Spanish names (e.g., García, Rodriguez, López)
- For German locations: Generate German names (e.g., Schmidt, Weber, Wagner)
- For other locations: Generate locally appropriate names based on the region

When suggesting an appointment, include a "suggested_appointment" field with a culturally appropriate doctor name:
{
    "action": "suggest_appointment",
    "message": "I found an available appointment...",
    "suggested_appointment": {
        "doctorName": "Dr. [culturally appropriate name]",
        "location": "...",
        "datetime": "...",
        "specialistType": "..."
    }
}

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
            response.action === "collect_info" &&
            sessionManager.isReadyForSuggestion(from)
        ) {
            response.action = "suggest_appointment";
            response.suggested_appointment = {
                doctorName:
                    response.suggested_appointment?.doctorName || "Dr. Smith", // Use AI generated name or fallback
                location: session?.appointmentInfo.location || "Medical Center",
                datetime: new Date(Date.now() + 86400000).toISOString(), // Tomorrow
                specialistType:
                    session?.appointmentInfo.specialistType || "general",
            };
            response.message = `Great! I found an available appointment with ${response.suggested_appointment.doctorName} at ${response.suggested_appointment.location} tomorrow. Would you like me to book this for you?`;
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
