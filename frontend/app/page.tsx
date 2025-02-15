"use client";

import { useState, FormEvent } from "react";
import { useChat } from "../hooks/useChat";
import { ScrollArea } from "@/components/ui/scroll-area";

export default function Home() {
    const { messages, isLoading, error, sendMessage } = useChat();
    const [inputMessage, setInputMessage] = useState("");

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        if (!inputMessage.trim() || isLoading) return;

        await sendMessage(inputMessage);
        setInputMessage("");
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
                    />
                    <button
                        type="submit"
                        disabled={isLoading}
                        className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors disabled:bg-blue-300"
                    >
                        Send
                    </button>
                </form>
            </div>
        </div>
    );
}
