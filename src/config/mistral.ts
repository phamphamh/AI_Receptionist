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
            maxTokens: 150,
        });

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
