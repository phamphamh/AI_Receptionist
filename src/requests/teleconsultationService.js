const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../fake_doctors.json');
const doctorsData = JSON.parse(fs.readFileSync(filePath, 'utf8'));

// Fonction pour proposer une téléconsultation disponible pour une date et une ville
function findTeleconsultation(date, city) {
    let teleDoctors = doctorsData.filter(d => 
        d.teleconsultation === true &&
        d.city === city &&
        d.tele_slots.includes(date)
    );

    return teleDoctors.length > 0 ? teleDoctors : null;
}

// Test
const testFindTeleconsultation = () => {
    const dateToTest = '2025-03-04T15:45:00';
    const cityToTest = 'Lyon';

    const result = findTeleconsultation(dateToTest, cityToTest);
    console.log('Test de recherche de téléconsultation:');
    console.log(`Recherche pour la date: ${dateToTest} et la ville: ${cityToTest}`);

    if (result) {
        console.log(`Médecin trouvé: ${result[0].name}`);
    } else {
        console.log('Aucun médecin trouvé.');
    }
};

// Lancer le test
testFindTeleconsultation();

module.exports = { findTeleconsultation };
