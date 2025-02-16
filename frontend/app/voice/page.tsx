"use client";

import { useState, useRef } from "react";
import { useChat } from "../../hooks/useChat";
import { Button } from "@/components/ui/button";
import { Mic, MicOff } from "lucide-react";
import { SoundWave } from "@/components/ui/sound-wave";

export default function VoicePage() {
    const { isLoading, error, sendAudioMessage, isPlaying } = useChat(true);
    const [isRecording, setIsRecording] = useState(false);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const chunksRef = useRef<Blob[]>([]);

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
        <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
            <div className="p-8 bg-white rounded-2xl shadow-xl w-80">
                <div className="flex flex-col items-center gap-6">
                    <h1 className="text-2xl font-bold text-gray-900">
                        Voice Assistant
                    </h1>

                    <div className="relative">
                        <Button
                            size="lg"
                            onClick={
                                isRecording ? stopRecording : startRecording
                            }
                            className={`w-24 h-24 rounded-full transition-all ${
                                isRecording
                                    ? "bg-red-500 hover:bg-red-600 animate-pulse"
                                    : "bg-blue-500 hover:bg-blue-600"
                            }`}
                            disabled={isLoading}
                        >
                            {isRecording ? (
                                <MicOff className="h-12 w-12" />
                            ) : (
                                <Mic className="h-12 w-12" />
                            )}
                        </Button>

                        {/* User's recording wave */}
                        <div className="absolute -bottom-12 left-1/2 -translate-x-1/2 w-48">
                            <SoundWave
                                isAnimating={isRecording}
                                color="#3B82F6"
                            />
                        </div>
                    </div>

                    <div className="h-16 flex items-center justify-center">
                        {isLoading ? (
                            <div className="text-sm text-gray-500">
                                Processing...
                            </div>
                        ) : (
                            <p className="text-sm text-gray-500">
                                {isRecording
                                    ? "Tap to stop recording"
                                    : "Tap to start recording"}
                            </p>
                        )}
                    </div>

                    {/* Bot's response wave */}
                    <div className="w-48">
                        <SoundWave isAnimating={isPlaying} color="#10B981" />
                    </div>

                    {error && (
                        <div className="text-sm text-red-500 text-center">
                            {error}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
