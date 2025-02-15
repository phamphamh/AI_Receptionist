export type ConversationStep =
  | "WELCOME"
  | "ASKING_SPECIALTY"
  | "CONFIRMING_SPECIALTY"
  | "ASKING_DATE"
  | "PROPOSING_DOCTOR"
  | "CONFIRMING_APPOINTMENT"
  | "COMPLETED";

export interface Doctor {
  id: number;
  name: string;
  specialty: string;
  city: string;
  phone: string;
  address: string;
  availability: string;
  slots: string[];
}

export interface ConversationState {
  userId: string;
  step: ConversationStep;
  specialty: string | null;
  preferredDate: string | null;
  selectedDoctor: Doctor | null;
  lastInteractionTime: Date;
}

export interface WhatsAppTemplate {
  name: string;
  language: string;
  components?: {
    type: string;
    parameters: any[];
  }[];
}
