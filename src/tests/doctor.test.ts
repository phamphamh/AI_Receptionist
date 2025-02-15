import { Doctor } from "../types/conversation.types";
import { doctorService } from "../services/doctor.service";
import { dateService } from "../services/date.service";

interface TestResponse {
  intent: string;
  entities: {
    doctor: string;
    date: string;
  };
}

function checkAvailability(doctors: Doctor[], response: TestResponse): string {
  const { doctor: requestedDoctor, date: requestedDate } = response.entities;

  // Trouver le médecin dans les données
  const doctor = doctors.find((d) => d.name === requestedDoctor);

  if (!doctor) {
    return `${requestedDoctor} n'est pas disponible dans notre système.`;
  }

  const parsedDate = new Date(requestedDate);
  if (!dateService.isValidDate(parsedDate)) {
    return `La date ${requestedDate} n'est pas valide.`;
  }

  const availableDoctors = doctorService.getAvailableDoctors(
    doctor.specialty,
    parsedDate
  );

  if (availableDoctors.includes(doctor)) {
    const slots = doctor.slots.filter((slot) => slot.startsWith(requestedDate));
    return `Voici les créneaux disponibles pour le ${requestedDate}: ${slots.join(
      ", "
    )}`;
  } else {
    return `Désolé, il n'y a pas de créneaux disponibles pour le ${requestedDate}.`;
  }
}

// Exemple d'utilisation
const testResponse: TestResponse = {
  intent: "book_appointment",
  entities: {
    doctor: "Isabelle Girard",
    date: "2024-02-20",
  },
};

// Exécuter le test
console.log("Test de disponibilité :");
const doctors = doctorService.getAllDoctors();
console.log(checkAvailability(doctors, testResponse));
