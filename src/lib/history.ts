interface Message {
    content: string;
    sender: "user" | "bot";
    timestamp: Date;
}

interface AppointmentInfo {
    specialistType?: string;
    location?: string;
    date?: string;
    timeSlot?: {
        start: number;
        end: number;
    };
    nextField?:
        | "specialistType"
        | "location"
        | "date"
        | "timeSlot"
        | "complete";
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
    appointmentInfo: AppointmentInfo;
    isComplete: boolean;
    messages: Message[];
}

class SessionManager {
    private activeSessions: Map<string, UserSession>;

    constructor() {
        this.activeSessions = new Map();
    }

    public startNewSession(phoneNumber: string): UserSession {
        const session: UserSession = {
            id: crypto.randomUUID(),
            phoneNumber,
            startedAt: new Date(),
            appointmentInfo: {
                nextField: "specialistType",
            },
            isComplete: false,
            messages: [],
        };
        this.activeSessions.set(phoneNumber, session);
        return session;
    }

    public updateSession(
        phoneNumber: string,
        update: Partial<AppointmentInfo>
    ): void {
        const session = this.activeSessions.get(phoneNumber);
        if (session) {
            session.appointmentInfo = {
                ...session.appointmentInfo,
                ...update,
            };

            // Update nextField based on what's missing
            if (!session.appointmentInfo.specialistType) {
                session.appointmentInfo.nextField = "specialistType";
            } else if (!session.appointmentInfo.location) {
                session.appointmentInfo.nextField = "location";
            } else if (!session.appointmentInfo.date) {
                session.appointmentInfo.nextField = "date";
            } else if (!session.appointmentInfo.timeSlot) {
                session.appointmentInfo.nextField = "timeSlot";
            } else {
                session.appointmentInfo.nextField = "complete";
                session.isComplete = true;
            }
        }
    }

    public getSession(phoneNumber: string): UserSession | undefined {
        return this.activeSessions.get(phoneNumber);
    }

    public endSession(phoneNumber: string): void {
        this.activeSessions.delete(phoneNumber);
    }

    public hasActiveSession(phoneNumber: string): boolean {
        return this.activeSessions.has(phoneNumber);
    }

    public addMessage(
        phoneNumber: string,
        content: string,
        sender: "user" | "bot"
    ): void {
        const session = this.activeSessions.get(phoneNumber);
        if (!session) {
            throw new Error(
                `No active session found for phone number: ${phoneNumber}`
            );
        }

        const message: Message = {
            content,
            sender,
            timestamp: new Date(),
        };

        session.messages.push(message);
        this.activeSessions.set(phoneNumber, session);
    }
}

export const sessionManager = new SessionManager();
