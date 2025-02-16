const fs = require('fs');
const path = require('path');

// Charger la base de données des médecins
const filePath = path.join(__dirname, '../fake_doctors.json');
const doctorsData = JSON.parse(fs.readFileSync(filePath, 'utf8'));

// Fonction pour vérifier la disponibilité d'un médecin avec spécialité
function isDoctorAvailable(doctorName, city, date, specialty) {
    let doctorData = doctorsData.find(d => d.name === doctorName && d.city === city && d.specialty === specialty);
    return doctorData && doctorData.slots.includes(date);
}

// Test simple pour la disponibilité d'un médecin
const testIsDoctorAvailable = () => {
    const doctorName = 'Marie Simon';
    const city = 'Paris';
    const dateToTest = '2025-03-17T10:00:00';
    const specialty = 'Cardiologue';

    const result = isDoctorAvailable(doctorName, city, dateToTest, specialty);
    console.log('🔎 Test de disponibilité du médecin:');
    console.log(`👩‍⚕️ Médecin: ${doctorName} | 🏙️ Ville: ${city} | 🩺 Spécialité: ${specialty}`);
    console.log(`📅 Date: ${new Date(dateToTest).toLocaleString('fr-FR', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric', 
        hour: '2-digit', 
        minute: '2-digit' 
    })}\n`);

    if (result) {
        console.log('✅ Le médecin est disponible à cette date.');
    } else {
        console.log('❌ Le médecin n\'est pas disponible à cette date.');
    }
};

// Fonction pour trouver des médecins alternatifs dans la même ville et spécialité
function findAlternativeAppointments(doctorName, city, date, specialty) {
    let availableDoctors = doctorsData.filter(d => 
        d.name !== doctorName && 
        d.city === city && 
        d.specialty === specialty && 
        d.slots.includes(date)
    );
    return availableDoctors.length > 0 ? availableDoctors : null;
}

// Test pour trouver des médecins alternatifs
const testFindAlternativeAppointments = () => {
    const doctorName = 'Marie Simon';
    const city = 'Paris';
    const dateToTest = '2025-03-30T16:59:00';
    const specialty = 'Cardiologue';

    const result = findAlternativeAppointments(doctorName, city, dateToTest, specialty);
    console.log('🔎 Test de médecins alternatifs:');
    console.log(`🏙️ Ville: ${city} | 🩺 Spécialité: ${specialty}`);
    console.log(`📅 Date: ${new Date(dateToTest).toLocaleString('fr-FR', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric', 
        hour: '2-digit', 
        minute: '2-digit' 
    })}\n`);

    if (result && result.length > 0) {
        console.log('✅ Médecins alternatifs trouvés:');
        result.forEach(doctor => {
            console.log(`👩‍⚕️ Dr. ${doctor.name}`);
            console.log('📆 Disponibilités:');
            doctor.slots.forEach(slot => {
                console.log(`  - ${new Date(slot).toLocaleString('fr-FR', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric', 
                    hour: '2-digit', 
                    minute: '2-digit' 
                })}`);
            });
        });
    } else {
        console.log('❌ Aucun médecin alternatif trouvé.');
    }
};

// Fonction pour trouver des médecins dans une ville voisine avec la même spécialité
function findDoctorsInNearbyCities(doctorName, city, date, specialty) {
    let availableDoctors = doctorsData.filter(d => 
        d.name !== doctorName && 
        d.city !== city && 
        d.specialty === specialty && 
        d.slots.includes(date)
    );
    return availableDoctors.length > 0 ? availableDoctors : null;
}

// Test pour trouver des médecins dans des villes voisines
const testFindDoctorsInNearbyCities = () => {
    const doctorName = 'Marie Simon';
    const city = 'Paris';
    const dateToTest = '2025-03-17T10:00:00';
    const specialty = 'Cardiologue';

    const result = findDoctorsInNearbyCities(doctorName, city, dateToTest, specialty);
    console.log('🔎 Test de médecins dans des villes voisines:\n');
    console.log(`📍 Ville actuelle: ${city} | 🩺 Spécialité: ${specialty}`);
    console.log(`📅 Date: ${dateToTest}\n`);

    if (result && result.length > 0) {
        console.log('✅ Médecins trouvés dans des villes voisines:');
        result.forEach(doctor => {
            console.log(`\n👩‍⚕️ Dr. ${doctor.name} | 📍 Ville: ${doctor.city}`);
            console.log('📆 Disponibilités:');
            doctor.slots.forEach(slot => {
                console.log(`  - ${new Date(slot).toLocaleString('fr-FR', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric', 
                    hour: '2-digit', 
                    minute: '2-digit' 
                })}`);
            });
        });
    } else {
        console.log('❌ Aucun médecin trouvé dans des villes voisines.');
    }
};

// Lancer les tests : node doctorService.js
testIsDoctorAvailable();
testFindAlternativeAppointments();
testFindDoctorsInNearbyCities();

module.exports = { 
    isDoctorAvailable,
    findAlternativeAppointments,
    findDoctorsInNearbyCities
};
