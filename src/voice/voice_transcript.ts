import dotenv from "dotenv";
import OpenAI from "openai";
import fs from "fs";
import path from "path";

dotenv.config();


const openai = new OpenAI({
    apiKey: process.env.OPEN_AI_API_KEY, 
});

// Function to transcribe audio using OpenAI Whisper
async function transcribeAudioFromFile(audioFilePath: string): Promise<string> {
    try {
        const audioBuffer = fs.readFileSync(audioFilePath);
        const audioFile = new File([audioBuffer], path.basename(audioFilePath), { type: "audio/ogg" });

        const transcriptionResponse = await openai.audio.transcriptions.create({
            file: audioFile,
            model: "whisper-1", // Model 
        });

        // Extract and return the transcribed text
        return transcriptionResponse.text;
    } catch (error) {
        console.error("Error transcribing audio:", error);
        throw error;
    }
}

async function main() {
    try {
        // Path to the audio file
        const audioFilePath = "./src/voice/voice_message.ogg";

        console.log("Transcribing audio...");
        const transcribedText = await transcribeAudioFromFile(audioFilePath);

        console.log("Transcription successful!");
        console.log("Transcribed Text:", transcribedText);
    } catch (error) {
        console.error("Error in main function:", error);
    }
}

main();