"use client";

import { useState, FormEvent, useRef } from "react";
import { useChat } from "../hooks/useChat";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Mic, MicOff, Send, Volume2, VolumeX } from "lucide-react";

export default function Home() {
    const {
        messages,
        isLoading,
        error,
        isPlaying,
        sendMessage,
        sendAudioMessage,
        playAudioResponse,
    } = useChat();
    const [inputMessage, setInputMessage] = useState("");
    const [isRecording, setIsRecording] = useState(false);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const chunksRef = useRef<Blob[]>([]);

    const scrollToBottom = () => {
        const chatContainer = document.getElementById("chat-container");
        if (chatContainer) {
            chatContainer.scrollTop = chatContainer.scrollHeight;
        }
    };

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        if (!inputMessage.trim() || isLoading) return;

        await sendMessage(inputMessage);
        setInputMessage("");
        setTimeout(scrollToBottom, 100);
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
        <div className="flex flex-col h-screen max-w-md mx-auto bg-white shadow-lg">
            <header className="border-b p-4 bg-[#e9f5eb] text-gray-800">
                <div className="flex items-center gap-2">
                    <img
                        src="/sona.png"
                        alt="Sona"
                        className="w-16 h-16 object-contain"
                    />
                    <div>
                        <h1 className="text-xl font-bold">Sona</h1>
                        <p className="text-sm opacity-75">
                            Your Medical Assistant
                        </p>
                    </div>
                </div>
            </header>

            <ScrollArea id="chat-container" className="flex-1 p-4">
                <div className="space-y-4">
                    {messages.map((message) => (
                        <div
                            key={message.id}
                            className={`flex items-start gap-2.5 ${
                                message.role === "user" ? "justify-end" : ""
                            }`}
                        >
                            <div
                                className={`flex items-center gap-2 rounded-2xl p-3 max-w-[80%] ${
                                    message.role === "user"
                                        ? "bg-[#85FA99] text-gray-800"
                                        : "bg-gray-100"
                                }`}
                            >
                                <p className="text-sm">{message.content}</p>
                                {message.role === "bot" &&
                                    message.speechFile && (
                                        <Button
                                            size="icon"
                                            variant="ghost"
                                            className="h-8 w-8 p-0 hover:bg-gray-200"
                                            onClick={() =>
                                                playAudioResponse(
                                                    message.speechFile!
                                                )
                                            }
                                        >
                                            {isPlaying ? (
                                                <VolumeX className="h-4 w-4" />
                                            ) : (
                                                <Volume2 className="h-4 w-4" />
                                            )}
                                        </Button>
                                    )}
                            </div>
                        </div>
                    ))}
                    {isLoading && (
                        <div className="flex items-start gap-2.5">
                            <div className="bg-gray-100 rounded-2xl p-3">
                                <div className="flex gap-2">
                                    <div className="w-2 h-2 bg-gray-300 rounded-full animate-bounce"></div>
                                    <div className="w-2 h-2 bg-gray-300 rounded-full animate-bounce delay-100"></div>
                                    <div className="w-2 h-2 bg-gray-300 rounded-full animate-bounce delay-200"></div>
                                </div>
                            </div>
                        </div>
                    )}
                    {error && (
                        <div className="text-red-500 text-sm text-center p-2 bg-red-50 rounded-lg">
                            {error}
                        </div>
                    )}
                </div>
            </ScrollArea>

            <div className="border-t p-4 bg-white">
                <form onSubmit={handleSubmit} className="flex gap-2">
                    <input
                        type="text"
                        value={inputMessage}
                        onChange={(e) => setInputMessage(e.target.value)}
                        placeholder="Type your message..."
                        className="flex-1 p-3 border rounded-full focus:outline-none focus:ring-2 focus:ring-[#85FA99]"
                        disabled={isRecording}
                    />
                    <Button
                        type="button"
                        onClick={isRecording ? stopRecording : startRecording}
                        className={`rounded-full w-12 h-12 flex items-center justify-center ${
                            isRecording
                                ? "bg-red-500 hover:bg-red-600"
                                : "bg-gray-200 hover:bg-gray-300 text-gray-700"
                        }`}
                        disabled={isLoading}
                    >
                        {isRecording ? (
                            <MicOff className="h-6 w-6" />
                        ) : (
                            <Mic className="h-6 w-6" />
                        )}
                    </Button>
                    <Button
                        type="submit"
                        disabled={
                            isLoading || isRecording || !inputMessage.trim()
                        }
                        className="rounded-full w-12 h-12 flex items-center justify-center bg-[#85FA99] text-gray-800 hover:bg-[#76e088] transition-colors disabled:bg-gray-200 disabled:text-gray-400"
                    >
                        <Send className="h-6 w-6" />
                    </Button>
                </form>
            </div>
        </div>
    );
}
