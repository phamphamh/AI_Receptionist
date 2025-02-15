interface Appointment {
    phoneNumber: string;
    date: Date;
    medicalDomain: string;
    status: "scheduled" | "cancelled" | "completed";
    scheduledAt: Date;
}

class AppointmentTracker {
    private appointments: Appointment[];

    constructor() {
        this.appointments = [];
    }

    public addAppointment(appointment: Omit<Appointment, "scheduledAt">): void {
        this.appointments.push({
            ...appointment,
            scheduledAt: new Date(),
        });
    }

    public getAllAppointments(): Appointment[] {
        return [...this.appointments];
    }

    public getUserAppointments(phoneNumber: string): Appointment[] {
        return this.appointments.filter(
            (apt) => apt.phoneNumber === phoneNumber
        );
    }

    public getAppointmentsByDate(date: Date): Appointment[] {
        return this.appointments.filter(
            (apt) => apt.date.toDateString() === date.toDateString()
        );
    }

    public getAppointmentsByDomain(domain: string): Appointment[] {
        return this.appointments.filter(
            (apt) => apt.medicalDomain.toLowerCase() === domain.toLowerCase()
        );
    }

    public updateAppointmentStatus(
        phoneNumber: string,
        date: Date,
        status: Appointment["status"]
    ): boolean {
        const appointment = this.appointments.find(
            (apt) =>
                apt.phoneNumber === phoneNumber &&
                apt.date.toDateString() === date.toDateString()
        );

        if (appointment) {
            appointment.status = status;
            return true;
        }
        return false;
    }
}

// // usage example:
// const appointmentTracker = new AppointmentTracker();

// // add a new appointment
// appointmentTracker.addAppointment({
//     phoneNumber: "+1234567890",
//     date: new Date("2025-02-22T09:30:00"),
//     medicalDomain: "dermatology",
//     status: "scheduled",
// });

// // get appointments
// const allAppointments = appointmentTracker.getAllAppointments();
// const userAppointments = appointmentTracker.getUserAppointments("+1234567890");
// const todayAppointments = appointmentTracker.getAppointmentsByDate(new Date());
// const dermatologyAppointments =
//     appointmentTracker.getAppointmentsByDomain("dermatology");

export default AppointmentTracker;
