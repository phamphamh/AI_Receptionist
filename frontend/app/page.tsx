"use client";

import { useState, FormEvent } from "react";
import { useChat } from "../hooks/useChat";

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
        <div className="min-h-screen flex flex-col p-4 max-w-2xl mx-auto">
            <header className="py-4 border-b">
                <h1 className="text-xl font-bold">Medical Chat Bot</h1>
            </header>

            <div className="flex-1 py-4 space-y-4 overflow-y-auto">
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
