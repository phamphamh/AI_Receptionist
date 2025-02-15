import { useState, useCallback } from "react";
import { Message, ChatState } from "../types/chat";

const INITIAL_STATE: ChatState = {
    messages: [
        {
            id: "1",
            content: "Hello! How can I help you today?",
            role: "bot",
            timestamp: new Date(),
        },
    ],
    isLoading: false,
    error: null,
};

export function useChat() {
    const [state, setState] = useState<ChatState>(INITIAL_STATE);

    const sendMessage = useCallback(async (content: string) => {
        try {
            const userMessage: Message = {
                id: Date.now().toString(),
                content,
                role: "user",
                timestamp: new Date(),
            };

            setState((prev) => ({
                ...prev,
                messages: [...prev.messages, userMessage],
                isLoading: true,
                error: null,
            }));

            const response = await fetch("/api/bot/chat", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    message: content,
                    userId: "test-user-id",
                }),
            });

            if (!response.ok) {
                throw new Error("Failed to send message");
            }

            const data = await response.json();

            const botMessage: Message = {
                id: (Date.now() + 1).toString(),
                content: data.message,
                role: "bot",
                timestamp: new Date(),
            };

            setState((prev) => ({
                ...prev,
                messages: [...prev.messages, botMessage],
                isLoading: false,
            }));
        } catch {
            setState((prev) => ({
                ...prev,
                isLoading: false,
                error: "Failed to send message",
            }));
        }
    }, []);

    return {
        messages: state.messages,
        isLoading: state.isLoading,
        error: state.error,
        sendMessage,
    };
}
