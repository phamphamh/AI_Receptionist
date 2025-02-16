import {
    checkDoctorAvailability,
    findAlternatives,
    findDoctorsInNearbyCities,
} from "../requests/appointmentService";
import { findTeleconsultation } from "../requests/teleconsultationService";
import { Doctor } from "../types/appointment";
import { doctorsData } from "../requests/doctorService";

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

interface TimeSlot {
    doctor: Doctor;
    datetime: string;
    location: string;
}

export function findAvailableTimeSlots(
    specialistType: string,
    preferredLocation: string,
    preferredTime: { startHour: number; endHour?: number },
    startDate: string,
    maxResults: number = 3
): TimeSlot[] {
    const allDoctors: Doctor[] = doctorsData.filter(
        (d: Doctor) =>
            d.specialty.toLowerCase() === specialistType.toLowerCase()
    );

    const slots: TimeSlot[] = [];
    const startDateTime = new Date(startDate);
    const endDateTime = new Date(startDateTime);
    endDateTime.setDate(endDateTime.getDate() + 30);

    allDoctors
        .filter((d) =>
            d.city.toLowerCase().includes(preferredLocation.toLowerCase())
        )
        .forEach((doctor) => {
            doctor.slots
                .filter((slot) => {
                    const slotDate = new Date(slot);
                    const hour = slotDate.getHours();
                    return (
                        slotDate >= startDateTime &&
                        slotDate <= endDateTime &&
                        hour >= preferredTime.startHour &&
                        (!preferredTime.endHour ||
                            hour <= preferredTime.endHour)
                    );
                })
                .slice(0, maxResults)
                .forEach((slot) => {
                    slots.push({
                        doctor,
                        datetime: slot,
                        location: doctor.city,
                    });
                });
        });

    // If we don't have enough slots, try nearby areas
    if (slots.length < maxResults) {
        // Get all unique cities from our database except the preferred one
        const nearbyCities = [
            ...new Set(
                doctorsData
                    .map((d) => d.city)
                    .filter(
                        (city) =>
                            !city
                                .toLowerCase()
                                .includes(preferredLocation.toLowerCase())
                    )
            ),
        ];

        allDoctors
            .filter((d) =>
                nearbyCities.some(
                    (city) => d.city.toLowerCase() === city.toLowerCase()
                )
            )
            .forEach((doctor) => {
                doctor.slots
                    .filter((slot) => {
                        const slotDate = new Date(slot);
                        const hour = slotDate.getHours();
                        return (
                            slotDate >= startDateTime &&
                            slotDate <= endDateTime &&
                            hour >= preferredTime.startHour &&
                            (!preferredTime.endHour ||
                                hour <= preferredTime.endHour)
                        );
                    })
                    .slice(0, maxResults - slots.length)
                    .forEach((slot) => {
                        slots.push({
                            doctor,
                            datetime: slot,
                            location: doctor.city,
                        });
                    });
            });
    }

    return slots;
}
