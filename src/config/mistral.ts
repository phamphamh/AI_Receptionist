import dotenv from "dotenv";
import { Mistral } from "@mistralai/mistralai";
import { sessionManager } from "../lib/history";
import {
    findAvailableAppointment,
    findAvailableTimeSlots,
} from "../services/appointment.service";
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

const parseTimePreferences = (message: string) => {
    const timePrefs = {
        startHour: 8,
        endHour: 18,
    };

    const timePattern =
        /(?:from|between|after)?\s*(\d+)\s*(?:am|pm)?\s*(?:to|until|and|-)?\s*(\d+)?\s*(?:am|pm)?/i;
    const match = message.match(timePattern);

    if (match) {
        let startHour = parseInt(match[1]);
        let endHour = match[2] ? parseInt(match[2]) : undefined;

        if (message.toLowerCase().includes("pm") && startHour !== 12) {
            startHour += 12;
        }
        if (endHour && message.toLowerCase().includes("pm") && endHour !== 12) {
            endHour += 12;
        }

        timePrefs.startHour = startHour;
        if (endHour) timePrefs.endHour = endHour;
    }

    return timePrefs;
};

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

        const timePrefs = parseTimePreferences(message);

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
            response.collected_info &&
            response.collected_info.location &&
            response.collected_info.specialistType &&
            response.collected_info.dateRange
        ) {
            const availableSlots = findAvailableTimeSlots(
                response.collected_info.specialistType,
                response.collected_info.location,
                timePrefs,
                response.collected_info.dateRange.startDate
            );

            if (availableSlots.length > 0) {
                const slotsToShow = availableSlots.slice(0, 3);
                const firstSlot = slotsToShow[0];

                response.action = "suggest_appointment";
                response.suggested_appointment = {
                    doctorName: firstSlot.doctor.name,
                    location: firstSlot.location,
                    datetime: firstSlot.datetime,
                    specialistType: firstSlot.doctor.specialty,
                };

                const formattedSlots = slotsToShow.map((slot, index) => {
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

                response.message = `I found ${
                    availableSlots.length > 3
                        ? "several"
                        : formattedSlots.length
                } available appointments. Here are ${
                    availableSlots.length > 3
                        ? "the 3 earliest options"
                        : "all options"
                }:\n\n${formattedSlots.join(
                    "\n"
                )}\n\nWould you like to book any of these appointments? Just let me know which number you prefer (1-${
                    formattedSlots.length
                }), or I can look for other options.`;
            } else {
                const noSlotsMessage = await client.chat.complete({
                    model: "mistral-tiny",
                    messages: [
                        {
                            role: "system",
                            content: `You are a helpful assistant explaining why no appointments were found.
                                     Be concise and friendly, and offer constructive alternatives.
                                     Don't mention specific dates unless provided in the user data.
                                     Focus on time preferences and location options.`,
                        },
                        {
                            role: "user",
                            content: JSON.stringify({
                                location: response.collected_info.location,
                                specialistType:
                                    response.collected_info.specialistType,
                                timePrefs: {
                                    start: `${timePrefs.startHour}:00`,
                                    end: timePrefs.endHour
                                        ? `${timePrefs.endHour}:00`
                                        : undefined,
                                },
                            }),
                        },
                    ],
                    temperature: 0.7,
                    maxTokens: 150,
                });

                response.message =
                    noSlotsMessage.choices?.[0]?.message?.content?.toString() ||
                    "I couldn't find any available appointments. Would you like to try different options?";
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
