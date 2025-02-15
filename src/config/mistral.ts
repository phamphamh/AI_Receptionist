import dotenv from "dotenv";
import { Mistral } from "@mistralai/mistralai";
import { tracker } from "../app";

dotenv.config();

const MISTRAL_API_KEY = process.env.MISTRAL_API_KEY;

if (!MISTRAL_API_KEY) {
    throw new Error("Missing Mistral API configuration");
}

const client = new Mistral({
    apiKey: MISTRAL_API_KEY,
});

export const getMistralResponse = async (
    from: string,
    message: string
): Promise<string> => {
    try {
        const chatResponse = await client.chat.complete({
            model: "mistral-tiny",
            messages: [
                {
                    role: "system",
                    content:
                        "You are HeyDoc, a professional and friendly virtual healthcare assistant. \
                        Your responses should be warm yet efficient, \
                        focusing on helping users schedule medical \
                        appointments and navigate healthcare services.",
                },
                ...(tracker
                    .getCurrentConversation(from)
                    ?.messages.map((msg) => ({
                        role: "user" as const,
                        content: msg,
                    })) || []),
            ],
            tools: [
                {
                    function: {
                        name: "setAppointment",
                        description: "Set an appointment",
                        parameters: {
                            type: "object",
                            properties: {
                                phoneNumber: {
                                    type: "string",
                                    description: "The user's phone number",
                                },
                                date: {
                                    type: "string",
                                    description: "The appointment date",
                                },
                                medicalDomain: {
                                    type: "string",
                                    description: "The medical domain",
                                },
                                status: {
                                    type: "string",
                                    description: "The appointment status",
                                },
                            },
                            required: ["phoneNumber", "date", "medicalDomain"],
                        },
                    },
                },
            ],
            toolChoice: "auto",
            maxTokens: 150,
        });

        const invokeTool = !!chatResponse.choices![0].message.toolCalls?.length;
        const toolCall =
            invokeTool && chatResponse.choices![0].message.toolCalls![0];

        // if (chatResponse.choices) {
        //     console.log(
        //         "CHAT RESPONSE",
        //         chatResponse.choices[0],
        //         chatResponse.choices[0].message.toolCalls?.[0]
        //     );
        // }

        if (invokeTool) {
            console.log("TOOL CALL", toolCall);
            if (toolCall) {
                const toolName = toolCall.function.name;
                if (toolName === "setAppointment") {
                    const { phoneNumber, date, medicalDomain, status } =
                        toolCall.function.arguments as any;
                    console.log(
                        "HELLLLLOOOOOOO",
                        phoneNumber,
                        date,
                        medicalDomain,
                        status
                    );
                }
            }

            return "Appointment set successfully";
        }

        if (chatResponse.choices && chatResponse.choices.length > 0) {
            return String(chatResponse.choices[0].message.content);
        } else {
            throw new Error("No response from Mistral API");
        }
    } catch (error) {
        console.error("Erreur lors de l'appel à Mistral API:", error);
        return "Désolé, je rencontre des difficultés techniques. Veuillez réessayer plus tard.";
    }
};
