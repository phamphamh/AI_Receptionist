import { twilioClient, twilioPhoneNumber } from "../config/twilio";
import { getMistralResponse } from "../config/mistral";

export const handleMessage = async (
    messageBody: string,
    From: string,
    To: string
): Promise<string> => {
    try {
        const aiResponse = await getMistralResponse(From, messageBody);
        console.log("Réponse IA:", aiResponse);

        console.log("Configuration Twilio:", {
            destinationNumber: From,
            messageBody: aiResponse,
        });

        // envoyer la reponse via whatsApp
        const message = await twilioClient.messages.create({
            body: aiResponse,
            from: To,
            to: From,
        });

        console.log("Message envoyé avec succès:", message.sid);
        return "Message traité avec succès";
    } catch (error) {
        console.error("Erreur lors de l'envoi du message:", error);
        throw error;
    }
};
