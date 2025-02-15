import { twilioClient, twilioPhoneNumber } from "../config/twilio";
import { getMistralResponse } from "../config/mistral";

export const handleMessage = async (
    messageBody: string,
    From: string,
    To: string
): Promise<string> => {
    try {
        const aiResponse = await getMistralResponse(From, messageBody);
        // console.log("Réponse IA:", aiResponse);

        // console.log("Configuration Twilio:", {
        //     destinationNumber: From,
        //     messageBody: aiResponse,
        // });

        // envoyer la reponse via whatsApp
        console.log("TEST: ", aiResponse, From, To);

        if (aiResponse === "Appointment set successfully") {
            const message = await twilioClient.messages.create({
                contentSid: "HX7dba1e0e532b799f99d4bd895c9b56a0",
                contentVariables: JSON.stringify({
                    1: "Dr. test123",
                    2: "21/02/2025",
                }),
                from: To,
                to: From,
            });

            console.log("Message envoyé avec succès:", message.sid);
        } else {
            const message = await twilioClient.messages.create({
                body: aiResponse,
                from: To,
                to: From,
            });
            console.log("Message envoyé avec succès:", message.sid);
        }
        return "Message traité avec succès";
    } catch (error) {
        console.error("Erreur lors de l'envoi du message:", error);
        throw error;
    }
};
