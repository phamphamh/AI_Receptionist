import { useState, useRef } from "react";

interface Message {
    id: string;
    content: string;
    role: "user" | "bot";
    speechFile?: string;
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
    speechFile?: string;
}

export const useChat = () => {
    const [messages, setMessages] = useState<Message[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const audioRef = useRef<HTMLAudioElement | null>(null);

    const addMessage = (
        content: string,
        role: "user" | "bot",
        speechFile?: string
    ) => {
        setMessages((prev) => [
            ...prev,
            { id: Date.now().toString(), content, role, speechFile },
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
                    userId: "user123",
                    wantsSpeech: false,
                }),
            });

            if (!response.ok) {
                throw new Error("Failed to send message");
            }

            const data: ChatResponse = await response.json();
            addMessage(data.message, "bot", data.speechFile);
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

            addMessage(data.message, "bot", data.speechFile);
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

    const playAudioResponse = async (fileName: string) => {
        try {
            console.log("Playing audio file:", fileName);

            if (audioRef.current) {
                audioRef.current.pause();
            }

            const audioUrl = `/api/bot/speech/${fileName}`;
            console.log("Audio URL:", audioUrl);

            const audio = new Audio(audioUrl);
            audioRef.current = audio;

            audio.onplay = () => {
                console.log("Audio started playing");
                setIsPlaying(true);
            };
            audio.onended = () => {
                console.log("Audio finished playing");
                setIsPlaying(false);
            };
            audio.onerror = (e) => {
                console.error("Audio error:", e);
                setIsPlaying(false);
                setError("Failed to play audio response");
            };

            await audio.play();
        } catch (err) {
            console.error("Error playing audio:", err);
            setError("Failed to play audio response");
        }
    };

    return {
        messages,
        isLoading,
        error,
        isPlaying,
        sendMessage,
        sendAudioMessage,
        playAudioResponse,
    };
};
