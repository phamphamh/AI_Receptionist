import { sessionManager } from "../lib/history";
import { Doctor, AppointmentResult } from "../types/appointment";
import {
    isDoctorAvailable,
    findAlternativeAppointments,
    findDoctorsInNearbyCities,
} from "./doctorService";
import { findTeleconsultation } from "./teleconsultationService";

// Check doctor availability with specialty
async function checkDoctorAvailability(
    phoneNumber: string,
    doctor: string,
    city: string,
    date: string,
    specialty: string
): Promise<AppointmentResult> {
    const doctorData = isDoctorAvailable(doctor, city, date, specialty);

    if (doctorData) {
        // Update session with confirmed appointment
        const session = sessionManager.getActiveSession(phoneNumber);
        if (session) {
            sessionManager.confirmAppointment(phoneNumber, {
                doctorName: doctorData.name,
                location: doctorData.city,
                datetime: new Date(date),
                specialistType: doctorData.specialty,
            });
        }

        return {
            success: true,
            message: `✅ Your appointment with Dr. ${doctor} (${specialty}) in ${city} is available on ${date}.`,
            doctor: doctorData,
            datetime: date,
        };
    }

    return {
        success: false,
        message: `❌ No slots available with Dr. ${doctor} (${specialty}) in ${city} on ${date}.`,
    };
}

// Find alternatives in the same city
async function findAlternatives(
    phoneNumber: string,
    doctor: string,
    city: string,
    date: string,
    specialty: string
): Promise<AppointmentResult> {
    const alternativeDoctors = findAlternativeAppointments(
        doctor,
        city,
        date,
        specialty
    );

    if (alternativeDoctors.length > 0) {
        let altMessage = `🔄 Alternatives available in ${city} for ${specialty}:\n`;
        alternativeDoctors.forEach(
            (d) =>
                (altMessage += `➡️ Dr. ${d.name} in ${city}, available on ${date}.\n`)
        );

        return {
            success: true,
            message: altMessage,
            doctor: alternativeDoctors[0],
            datetime: date,
        };
    }

    return {
        success: false,
        message: `❌ No available ${specialty} doctors in ${city} on ${date}.`,
    };
}

// Offer teleconsultation
async function offerTeleconsultation(
    phoneNumber: string,
    specialty: string,
    date: string
): Promise<AppointmentResult> {
    const teleconsult = findTeleconsultation(date, specialty);

    if (teleconsult.length > 0) {
        return {
            success: true,
            message: `📅 Teleconsultation available with Dr. ${teleconsult[0].name} (${specialty}) on ${date}`,
            doctor: teleconsult[0],
            datetime: date,
            isTelemedicine: true,
        };
    }

    return {
        success: false,
        message: `📅 No teleconsultations available for ${specialty} on ${date}.`,
    };
}

// Find doctors in nearby cities
async function findNearbyDoctors(
    phoneNumber: string,
    doctor: string,
    city: string,
    date: string,
    specialty: string
): Promise<AppointmentResult> {
    const nearbyDoctors = findDoctorsInNearbyCities(
        doctor,
        city,
        date,
        specialty
    );

    if (nearbyDoctors.length > 0) {
        let nearbyMessage = `Available ${specialty} doctors in nearby cities:\n`;
        nearbyDoctors.forEach(
            (d) =>
                (nearbyMessage += `➡️ Dr. ${d.name} in ${d.city}, available on ${date}.\n`)
        );

        return {
            success: true,
            message: nearbyMessage,
            doctor: nearbyDoctors[0],
            datetime: date,
        };
    }

    return {
        success: false,
        message: `😞 Sorry, no available ${specialty} doctors nearby on ${date}.`,
    };
}

export {
    checkDoctorAvailability,
    findAlternatives,
    offerTeleconsultation,
    findNearbyDoctors,
    findDoctorsInNearbyCities,
};

// async function runTests() {
//     console.log("🔍 Running tests...\n");

//     const doctor = "Marie Simon";
//     const city = "Paris";
//     const specialty = "Cardiologue";
//     const date = "2025-03-17T10:00:00";
//     const user_phone = "+33612345678";

//     console.log("✅ Test 1: checkDoctorAvailability");
//     console.log(
//         await checkDoctorAvailability(user_phone, doctor, city, date, specialty)
//     );

//     console.log("\n🔄 Test 2: findAlternatives");
//     console.log(
//         await findAlternatives(user_phone, doctor, city, date, specialty)
//     );

//     console.log("\n📅 Test 3: offerTeleconsultation");
//     console.log(await offerTeleconsultation(user_phone, specialty, date));

//     console.log("\n🌍 Test 4: findNearbyDoctors");
//     console.log(
//         await findNearbyDoctors(user_phone, doctor, city, date, specialty)
//     );
// }

// runTests();
