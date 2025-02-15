import AppointmentTracker from "./appointments";

interface UserInfo {
    phoneNumber: string;
    location?: string;
    age?: number;
    preferredLanguage?: string;
}

interface DateRange {
    start: Date;
    end: Date;
}

interface AppointmentDetails {
    location?: string;
    specialistType?: string;
    dateRange?: {
        startDate: string;
        endDate: string;
    };
    suggestedAppointment?: {
        doctorName: string;
        location: string;
        datetime: Date;
    };
    status: "collecting_info" | "suggested" | "confirmed" | "cancelled";
    missingFields?: string[];
}

interface Conversation {
    messages: string[];
    startedAt: Date;
    endedAt?: Date;
    appointmentDetails: AppointmentDetails;
}

interface Message {
    content: string;
    sender: "user" | "bot";
    timestamp: Date;
}

interface AppointmentInfo {
    location?: string;
    specialistType?: string;
    dateRange?: {
        startDate: string;
        endDate: string;
    };
    missingFields: string[];
}

interface ConfirmedAppointment {
    doctorName: string;
    location: string;
    datetime: Date;
    specialistType: string;
    status: "scheduled" | "cancelled" | "completed";
}

interface UserSession {
    id: string;
    phoneNumber: string;
    startedAt: Date;
    endedAt?: Date;
    messages: Message[];
    appointmentInfo: AppointmentInfo;
    confirmedAppointment?: ConfirmedAppointment;
}

class SessionManager {
    private activeSessions: Map<string, UserSession>; // phoneNumber -> session
    private sessionHistory: UserSession[]; // Completed sessions

    constructor() {
        this.activeSessions = new Map();
        this.sessionHistory = [];
    }

    public startNewSession(phoneNumber: string): UserSession {
        const session: UserSession = {
            id: crypto.randomUUID(),
            phoneNumber,
            startedAt: new Date(),
            messages: [],
            appointmentInfo: {
                missingFields: ["location", "specialistType", "dateRange"],
            },
        };
        this.activeSessions.set(phoneNumber, session);
        return session;
    }

    public addMessage(
        phoneNumber: string,
        content: string,
        sender: "user" | "bot"
    ): void {
        let session = this.activeSessions.get(phoneNumber);
        if (!session) {
            session = this.startNewSession(phoneNumber);
        }

        session.messages.push({
            content,
            sender,
            timestamp: new Date(),
        });
    }

    public updateAppointmentInfo(
        phoneNumber: string,
        info: Partial<AppointmentInfo>
    ): void {
        const session = this.activeSessions.get(phoneNumber);
        if (session) {
            // Update appointment info
            session.appointmentInfo = {
                ...session.appointmentInfo,
                ...info,
            };

            // Update missing fields
            const missingFields: string[] = [];
            if (!session.appointmentInfo.location)
                missingFields.push("location");
            if (!session.appointmentInfo.specialistType)
                missingFields.push("specialistType");
            if (!session.appointmentInfo.dateRange)
                missingFields.push("dateRange");

            session.appointmentInfo.missingFields = missingFields;
        }
    }

    public confirmAppointment(
        phoneNumber: string,
        appointment: Omit<ConfirmedAppointment, "status">
    ): void {
        const session = this.activeSessions.get(phoneNumber);
        if (session) {
            session.confirmedAppointment = {
                ...appointment,
                status: "scheduled",
            };
            this.endSession(phoneNumber);
        }
    }

    public endSession(phoneNumber: string): void {
        const session = this.activeSessions.get(phoneNumber);
        if (session) {
            session.endedAt = new Date();
            this.sessionHistory.push(session);
            this.activeSessions.delete(phoneNumber);
        }
    }

    public getActiveSession(phoneNumber: string): UserSession | undefined {
        return this.activeSessions.get(phoneNumber);
    }

    public isReadyForSuggestion(phoneNumber: string): boolean {
        const session = this.activeSessions.get(phoneNumber);
        return session?.appointmentInfo.missingFields.length === 0 || false;
    }

    public getMissingFields(phoneNumber: string): string[] {
        return (
            this.activeSessions.get(phoneNumber)?.appointmentInfo
                .missingFields || []
        );
    }

    public getUserHistory(phoneNumber: string): UserSession[] {
        return this.sessionHistory.filter(
            (session) => session.phoneNumber === phoneNumber
        );
    }

    public hasActiveSession(phoneNumber: string): boolean {
        return this.activeSessions.has(phoneNumber);
    }
}

export const sessionManager = new SessionManager();
