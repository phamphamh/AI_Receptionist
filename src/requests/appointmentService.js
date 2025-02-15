const { 
    isDoctorAvailable, 
    findAlternativeAppointments, 
    findDoctorsInNearbyCities 
} = require('./doctorService');
const { findTeleconsultation } = require('./teleconsultationService');

// Vérifie la disponibilité du médecin avec la spécialité
async function checkDoctorAvailability(doctor, city, date, specialty, user_phone) {
    if (isDoctorAvailable(doctor, city, date, specialty)) {
        return {
            message: `✅ Your appointment with Dr. ${doctor} (${specialty}) in ${city} is available on ${date}.`,
            user_phone: user_phone,
            nextStep: null
        };
    } else {
        return {
            message: `❌ No slots available with Dr. ${doctor} (${specialty}) in ${city} on ${date}.`,
            user_phone: user_phone,
            nextStep: "findAlternatives"
        };
    }
}

// Fonction qui propose des alternatives dans la même ville
async function findAlternatives(doctor, city, date, specialty, user_phone) {
    const alternativeDoctors = findAlternativeAppointments(doctor, city, date, specialty) || [];

    if (alternativeDoctors.length > 0) {
        let altMessage = `🔄 Alternatives available in ${city} for ${specialty}:\n`;
        alternativeDoctors.forEach(d => altMessage += `➡️ Dr. ${d.name} in ${city}, available on ${date}.\n`);
        return {
            message: altMessage,
            user_phone: user_phone,
            nextStep: "offerTeleconsultation"
        };
    } else {
        return {
            message: `❌ No available ${specialty} doctors in ${city} on ${date}.`,
            user_phone: user_phone,
            nextStep: "findTeleconsultation"
        };
    }
}


// Fonction qui propose une téléconsultation
async function offerTeleconsultation(specialty, date, user_phone) {
    const teleconsult = findTeleconsultation(date, specialty) || [];

    if (teleconsult.length > 0) {
        return {
            message: `📅 No physical appointments found. Would you like a teleconsultation with Dr. ${teleconsult[0].name} (${specialty}) on ${date}?`,
            user_phone: user_phone,
            nextStep: "findNearbyDoctors"
        };
    } else {
        return {
            message: `📅 No teleconsultations available for ${specialty} on ${date}.`,
            user_phone: user_phone,
            nextStep: "findNearbyDoctors"
        };
    }
}

// Fonction qui propose des médecins dans des villes voisines
async function findNearbyDoctors(doctor, city, date, specialty, user_phone) {
    const nearbyDoctors = findDoctorsInNearbyCities(doctor, city, date, specialty) || [];

    if (nearbyDoctors.length > 0) {
        let nearbyMessage = `Available ${specialty} doctors in nearby cities:\n`;
        nearbyDoctors.forEach(d => nearbyMessage += `➡️ Dr. ${d.name} in ${d.city}, available on ${date}.\n`);
        return {
            message: nearbyMessage,
            user_phone: user_phone,
            nextStep: null
        };
    } else {
        return {
            message: `😞 Sorry, no available ${specialty} doctors nearby on ${date}. Please try again later!`,
            user_phone: user_phone,
            nextStep: null
        };
    }
}

module.exports = { 
    checkDoctorAvailability,
    findAlternatives,
    offerTeleconsultation,
    findNearbyDoctors
};

async function runTests() {
    console.log("🔍 Running tests...\n");

    const doctor = "Marie Simon";
    const city = "Paris";
    const specialty = "Cardiologue";
    const date = "2025-03-17T10:00:00";
    const user_phone = "+33612345678";

    console.log("✅ Test 1: checkDoctorAvailability");
    console.log(await checkDoctorAvailability(doctor, city, date, specialty, user_phone));
    
    console.log("\n🔄 Test 2: findAlternatives");
    console.log(await findAlternatives(doctor, city, date, specialty, user_phone));
    
    console.log("\n📅 Test 3: offerTeleconsultation");
    console.log(await offerTeleconsultation(specialty, date, user_phone));
    
    console.log("\n🌍 Test 4: findNearbyDoctors");
    console.log(await findNearbyDoctors(doctor, city, date, specialty, user_phone));
}

runTests();
