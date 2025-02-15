"use client";

import { useState, FormEvent, useRef } from "react";
import { useChat } from "../hooks/useChat";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Mic, MicOff, Send } from "lucide-react";

export default function Home() {
    const { messages, isLoading, error, sendMessage, sendAudioMessage } =
        useChat();
    const [inputMessage, setInputMessage] = useState("");
    const [isRecording, setIsRecording] = useState(false);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const chunksRef = useRef<Blob[]>([]);

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        if (!inputMessage.trim() || isLoading) return;

        await sendMessage(inputMessage);
        setInputMessage("");
    };

    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                audio: true,
            });
            const mediaRecorder = new MediaRecorder(stream);
            mediaRecorderRef.current = mediaRecorder;
            chunksRef.current = [];

            mediaRecorder.ondataavailable = (e) => {
                if (e.data.size > 0) {
                    chunksRef.current.push(e.data);
                }
            };

            mediaRecorder.onstop = async () => {
                const audioBlob = new Blob(chunksRef.current, {
                    type: "audio/webm",
                });
                await handleAudioUpload(audioBlob);

                stream.getTracks().forEach((track) => track.stop());
            };

            mediaRecorder.start();
            setIsRecording(true);
        } catch (err) {
            console.error("Error accessing microphone:", err);
            alert(
                "Error accessing microphone. Please ensure you have granted microphone permissions."
            );
        }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop();
            setIsRecording(false);
        }
    };

    const handleAudioUpload = async (audioBlob: Blob) => {
        if (isLoading) return;

        const formData = new FormData();
        formData.append("audio", audioBlob, "recording.webm");
        formData.append("userId", "user123");

        await sendAudioMessage(formData);
    };

    return (
        <div className="flex flex-col h-screen">
            <header className="border-b p-4">
                <h1 className="text-xl font-bold">Medical Chat Bot</h1>
            </header>

            <ScrollArea className="flex-1 p-4">
                <div className="space-y-4">
                    {messages.map((message) => (
                        <div
                            key={message.id}
                            className={`flex items-start gap-2.5 ${
                                message.role === "user" ? "justify-end" : ""
                            }`}
                        >
                            <div
                                className={`rounded-lg p-3 max-w-[80%] ${
                                    message.role === "user"
                                        ? "bg-blue-500 text-white"
                                        : "bg-gray-100"
                                }`}
                            >
                                <p className="text-sm">{message.content}</p>
                            </div>
                        </div>
                    ))}
                    {isLoading && (
                        <div className="flex items-start gap-2.5">
                            <div className="bg-gray-100 rounded-lg p-3">
                                <p className="text-sm">Typing...</p>
                            </div>
                        </div>
                    )}
                    {error && (
                        <div className="text-red-500 text-sm text-center">
                            {error}
                        </div>
                    )}
                </div>
            </ScrollArea>

            <div className="border-t p-4">
                <form onSubmit={handleSubmit} className="flex gap-2">
                    <input
                        type="text"
                        value={inputMessage}
                        onChange={(e) => setInputMessage(e.target.value)}
                        placeholder="Type your message..."
                        className="flex-1 p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        disabled={isRecording}
                    />
                    <Button
                        type="button"
                        onClick={isRecording ? stopRecording : startRecording}
                        className={`px-4 py-2 rounded-lg transition-colors ${
                            isRecording
                                ? "bg-red-500 hover:bg-red-600"
                                : "bg-gray-500 hover:bg-gray-600"
                        }`}
                        disabled={isLoading}
                    >
                        {isRecording ? (
                            <MicOff className="h-5 w-5" />
                        ) : (
                            <Mic className="h-5 w-5" />
                        )}
                    </Button>
                    <Button
                        type="submit"
                        disabled={isLoading || isRecording}
                        className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors disabled:bg-blue-300"
                    >
                        <Send className="h-5 w-5" />
                    </Button>
                </form>
            </div>
        </div>
    );
}
