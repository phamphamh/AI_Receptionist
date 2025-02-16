import {
    checkDoctorAvailability,
    findAlternatives,
    findDoctorsInNearbyCities,
} from "../requests/appointmentService";
import { findTeleconsultation } from "../requests/teleconsultationService";
import { Doctor } from "../types/appointment";

export interface AppointmentSearchResult {
    type: "direct" | "teleconsultation" | "nearby" | "not_found";
    success: boolean;
    doctor?: Doctor;
    datetime?: string;
    location?: string;
    isTelemedicine?: boolean;
}

export async function findAvailableAppointment(
    phoneNumber: string,
    location: string,
    specialistType: string,
    date: string
): Promise<AppointmentSearchResult> {
    // Try to find a direct match first
    const doctors = await findAlternatives(
        phoneNumber,
        "",
        location,
        date,
        specialistType
    );

    if (doctors.success && doctors.doctor) {
        return {
            type: "direct",
            success: true,
            doctor: doctors.doctor,
            datetime: doctors.datetime,
            location: location,
        };
    }

    // Try teleconsultation
    const teleConsult = await findTeleconsultation(date, specialistType);
    if (teleConsult.length > 0) {
        return {
            type: "teleconsultation",
            success: true,
            doctor: teleConsult[0],
            datetime: date,
            isTelemedicine: true,
        };
    }

    // Try nearby cities
    const nearbyDoctors = await findDoctorsInNearbyCities(
        "",
        location,
        date,
        specialistType
    );

    if (nearbyDoctors.length > 0) {
        return {
            type: "nearby",
            success: true,
            doctor: nearbyDoctors[0],
            datetime: date,
            location: nearbyDoctors[0].city,
        };
    }

    return {
        type: "not_found",
        success: false,
    };
}
