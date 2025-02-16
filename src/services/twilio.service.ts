import { twilioClient } from "../config/twilio";
import { getMistralResponse } from "../config/mistral";

export const handleMessage = async (
    messageBody: string,
    From: string,
    To: string
): Promise<string> => {
    try {
        const aiResponse = await getMistralResponse(From, messageBody);

        await twilioClient.messages.create({
            body: aiResponse.message,
            from: To,
            to: From,
        });

        return "Message processed successfully";
    } catch (error) {
        console.error("Error in handleMessage:", error);
        throw error;
    }
};
