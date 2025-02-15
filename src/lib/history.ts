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
    medicalDomain?: string;
    preferredDates?: DateRange;
    acceptedDate?: Date;
    preferredTimeOfDay?: "morning" | "afternoon" | "evening";
}

interface Conversation {
    messages: string[];
    startedAt: Date;
    endedAt?: Date;
    appointmentDetails: AppointmentDetails;
}

class HistoryTracker {
    private users: Map<string, Conversation[]>;
    private activeConversations: Map<string, Conversation>;
    private userInfo: Map<string, UserInfo>;

    constructor() {
        this.users = new Map();
        this.activeConversations = new Map();
        this.userInfo = new Map();
    }

    public addUser(info: UserInfo): void {
        this.userInfo.set(info.phoneNumber, info);
        if (!this.users.has(info.phoneNumber)) {
            this.users.set(info.phoneNumber, []);
        }
    }

    public updateUserInfo(phoneNumber: string, info: Partial<UserInfo>): void {
        const existingInfo = this.userInfo.get(phoneNumber) || { phoneNumber };
        this.userInfo.set(phoneNumber, { ...existingInfo, ...info });
    }

    public addMessage(phoneNumber: string, message: string): void {
        // create user history if it doesn't exist
        if (!this.users.has(phoneNumber)) {
            this.users.set(phoneNumber, []);
        }

        // create new conversation if user doesn't have an active one
        if (!this.activeConversations.has(phoneNumber)) {
            const newConversation: Conversation = {
                messages: [],
                startedAt: new Date(),
                appointmentDetails: {},
            };
            this.activeConversations.set(phoneNumber, newConversation);
        }

        // add message to active conversation
        const conversation = this.activeConversations.get(phoneNumber)!;
        conversation.messages.push(message);
    }

    public updateAppointmentDetails(
        phoneNumber: string,
        details: Partial<AppointmentDetails>
    ): void {
        const conversation = this.activeConversations.get(phoneNumber);
        if (conversation) {
            conversation.appointmentDetails = {
                ...conversation.appointmentDetails,
                ...details,
            };
        }
    }

    public endConversation(
        phoneNumber: string,
        appointmentAccepted: boolean,
        appointmentTracker: AppointmentTracker
    ): void {
        const activeConversation = this.activeConversations.get(phoneNumber);
        if (activeConversation) {
            activeConversation.endedAt = new Date();

            // if appointment was accepted, create it in the appointment tracker
            if (
                appointmentAccepted &&
                activeConversation.appointmentDetails.acceptedDate &&
                activeConversation.appointmentDetails.medicalDomain
            ) {
                appointmentTracker.addAppointment({
                    phoneNumber,
                    date: activeConversation.appointmentDetails.acceptedDate,
                    medicalDomain:
                        activeConversation.appointmentDetails.medicalDomain,
                    status: "scheduled",
                });
            }

            // save to user's history
            const userHistory = this.users.get(phoneNumber)!;
            userHistory.push(activeConversation);

            // remove from active conversations
            this.activeConversations.delete(phoneNumber);
        }
    }

    public getUserInfo(phoneNumber: string): UserInfo | undefined {
        return this.userInfo.get(phoneNumber);
    }

    public getUserHistory(phoneNumber: string): Conversation[] {
        return this.users.get(phoneNumber) || [];
    }

    public getCurrentConversation(
        phoneNumber: string
    ): Conversation | undefined {
        return this.activeConversations.get(phoneNumber);
    }

    public hasActiveConversation(phoneNumber: string): boolean {
        return this.activeConversations.has(phoneNumber);
    }
}

// // usage example:
// const history = new HistoryTracker();

// // add a new user
// history.addUser({
//     phoneNumber: "+1234567890",
//     location: "Paris",
//     age: 35,
//     preferredLanguage: "french",
// });

// // start conversation and update appointment details as they come
// history.addMessage(
//     "+1234567890",
//     "Bonjour, je voudrais prendre un rendez-vous en dermatologie"
// );

// history.updateAppointmentDetails("+1234567890", {
//     medicalDomain: "dermatology",
//     preferredDates: {
//         start: new Date("2025-02-20"),
//         end: new Date("2025-02-28"),
//     },
//     preferredTimeOfDay: "morning",
// });

// history.addMessage("+1234567890", "Je préfère un rendez-vous le matin");

// // when appointment is accepted
// history.updateAppointmentDetails("+1234567890", {
//     acceptedDate: new Date("2025-02-22T09:30:00"),
// });

// // end conversation with accepted appointment
// history.endConversation("+1234567890", true);

export default HistoryTracker;
