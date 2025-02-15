export type MessageRole = "user" | "bot";

export interface Message {
    id: string;
    content: string;
    role: MessageRole;
    timestamp: Date;
}

export interface ChatState {
    messages: Message[];
    isLoading: boolean;
    error: string | null;
}

export interface BotResponse {
    message: string;
    action?: "confirm_appointment" | "decline_appointment";
    suggested_appointment?: {
        doctorName: string;
        location: string;
        datetime: string;
        specialistType: string;
    };
}
