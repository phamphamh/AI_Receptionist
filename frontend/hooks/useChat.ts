import { useState } from "react";

interface Message {
    id: string;
    content: string;
    role: "user" | "bot";
}

interface SuggestedAppointment {
    doctorName: string;
    location: string;
    datetime: string;
    specialistType: string;
}

interface ChatResponse {
    message: string;
    action?: string;
    suggested_appointment?: SuggestedAppointment;
    transcription?: string;
}

export const useChat = () => {
    const [messages, setMessages] = useState<Message[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const addMessage = (content: string, role: "user" | "bot") => {
        setMessages((prev) => [
            ...prev,
            { id: Date.now().toString(), content, role },
        ]);
    };

    const sendMessage = async (message: string) => {
        setIsLoading(true);
        setError(null);
        addMessage(message, "user");

        try {
            const response = await fetch("/api/bot/message", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    message,
                    userId: "user123", // Replace with actual user ID management
                }),
            });

            if (!response.ok) {
                throw new Error("Failed to send message");
            }

            const data: ChatResponse = await response.json();
            addMessage(data.message, "bot");
        } catch (err) {
            setError(
                err instanceof Error ? err.message : "Failed to send message"
            );
            console.error("Error sending message:", err);
        } finally {
            setIsLoading(false);
        }
    };

    const sendAudioMessage = async (formData: FormData) => {
        setIsLoading(true);
        setError(null);

        try {
            const response = await fetch("/api/bot/audio", {
                method: "POST",
                body: formData,
            });

            if (!response.ok) {
                throw new Error("Failed to send audio message");
            }

            const data: ChatResponse = await response.json();

            if (data.transcription) {
                addMessage(data.transcription, "user");
            }

            addMessage(data.message, "bot");
        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : "Failed to send audio message"
            );
            console.error("Error sending audio message:", err);
        } finally {
            setIsLoading(false);
        }
    };

    return {
        messages,
        isLoading,
        error,
        sendMessage,
        sendAudioMessage,
    };
};
