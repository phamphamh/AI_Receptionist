// src/handleAppointmentRequest.js

const { checkDoctorAvailability, findAlternatives, offerTeleconsultation, findNearbyDoctors } = require('./services/appointmentService');

async function handleAppointmentRequest(response) {
    const { doctor, date, city, user_phone } = response.entities;

    // Étape 1 : Vérifier la disponibilité du médecin
    let result = await checkDoctorAvailability(doctor, city, date, user_phone);
    if (result.nextStep === "findAlternatives") {
        // Étape 2 : Proposer des alternatives dans la même ville
        result = await findAlternatives(doctor, city, date, user_phone);
        if (result.nextStep === "offerTeleconsultation") {
            // Étape 3 : Proposer une téléconsultation
            result = await offerTeleconsultation(doctor, date, user_phone);
            if (result.nextStep === "findNearbyDoctors") {
                // Étape 4 : Proposer des médecins dans des villes voisines
                result = await findNearbyDoctors(doctor, city, date, user_phone);
            }
        }
    }

    console.log(result.message);  // Affiche le message à l'utilisateur (ou envoie-le via Twilio ou un autre service)
}

module.exports = { handleAppointmentRequest };
