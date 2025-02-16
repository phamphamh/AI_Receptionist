export interface Doctor {
    id: number;
    name: string;
    specialty: string;
    city: string;
    phone: string;
    address: string;
    availability: string;
    slots: string[];
    teleconsultation: boolean;
    tele_slots: string[];
}

export interface AppointmentResult {
    success: boolean;
    message: string;
    doctor?: Doctor;
    datetime?: string;
    isTelemedicine?: boolean;
}
