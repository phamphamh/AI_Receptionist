import { Doctor } from "../types/conversation.types";
import * as fs from "fs";
import * as path from "path";

class DoctorService {
  private doctors: Doctor[] = [];

  constructor() {
    this.loadDoctors();
  }

  private loadDoctors(): void {
    try {
      const filePath = path.join(__dirname, "../../doctors_data.json");
      const data = fs.readFileSync(filePath, "utf8");
      this.doctors = JSON.parse(data);
      console.log("Médecins chargés:", this.doctors.length);
    } catch (error) {
      console.error("Erreur lors du chargement des médecins:", error);
      this.doctors = [];
    }
  }

  public findDoctorsBySpecialty(specialty: string): Doctor[] {
    const doctors = this.doctors.filter(
      (doctor) => doctor.specialty.toLowerCase() === specialty.toLowerCase()
    );
    console.log(
      `Médecins trouvés pour la spécialité ${specialty}:`,
      doctors.length
    );
    return doctors;
  }

  public findAvailableSlots(
    doctorId: number,
    startDate: Date,
    endDate: Date
  ): string[] {
    const doctor = this.doctors.find((d) => d.id === doctorId);
    if (!doctor || !doctor.slots) return [];

    return doctor.slots.filter((slot) => {
      const slotDate = new Date(slot);
      return slotDate >= startDate && slotDate <= endDate;
    });
  }

  public getDoctorById(id: number): Doctor | undefined {
    return this.doctors.find((doctor) => doctor.id === id);
  }

  public getAvailableDoctors(specialty: string, preferredDate: Date): Doctor[] {
    console.log(
      `Recherche de médecins disponibles pour ${specialty} le ${preferredDate}`
    );

    const startOfDay = new Date(preferredDate);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(preferredDate);
    endOfDay.setHours(23, 59, 59, 999);

    const availableDoctors = this.doctors.filter((doctor) => {
      // Vérification de base
      if (!doctor) {
        console.log("Médecin invalide trouvé dans la liste");
        return false;
      }

      // Vérification de la spécialité
      if (doctor.specialty.toLowerCase() !== specialty.toLowerCase()) {
        return false;
      }

      // Vérification des créneaux
      if (!doctor.slots || !Array.isArray(doctor.slots)) {
        console.log(`Pas de créneaux valides pour le médecin ${doctor.name}`);
        return false;
      }

      // Recherche d'un créneau disponible
      const hasAvailableSlot = doctor.slots.some((slot) => {
        if (!slot) return false;
        try {
          const slotDate = new Date(slot);
          return slotDate >= startOfDay && slotDate <= endOfDay;
        } catch (error) {
          console.error(`Erreur lors du parsing de la date ${slot}:`, error);
          return false;
        }
      });

      if (!hasAvailableSlot) {
        console.log(
          `Pas de créneaux disponibles pour ${doctor.name} à la date demandée`
        );
      }

      return hasAvailableSlot;
    });

    console.log(`${availableDoctors.length} médecins disponibles trouvés`);
    return availableDoctors;
  }
}

export const doctorService = new DoctorService();
