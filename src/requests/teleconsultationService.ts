import { Doctor } from "../types/appointment";
import { doctorsData } from "./doctorService";

// Find available teleconsultation for a date and specialty
function findTeleconsultation(date: string, specialty: string): Doctor[] {
    return doctorsData.filter(
        (d) =>
            d.teleconsultation === true &&
            d.specialty === specialty &&
            d.tele_slots.includes(date)
    );
}

// Test
const testFindTeleconsultation = () => {
    const dateToTest = "2025-03-04T15:45:00";
    const specialtyToTest = "Cardiologue";

    const result = findTeleconsultation(dateToTest, specialtyToTest);
    console.log("Test de recherche de téléconsultation:");
    console.log(
        `Recherche pour la date: ${dateToTest} et la spécialité: ${specialtyToTest}`
    );

    if (result.length > 0) {
        console.log(
            `Médecins trouvés: ${result.map((d) => d.name).join(", ")}`
        );
    } else {
        console.log("Aucun médecin trouvé.");
    }
};

// Lancer le test
testFindTeleconsultation();

export { findTeleconsultation };
