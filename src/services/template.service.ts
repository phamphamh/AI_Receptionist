import { WhatsAppTemplate } from "../types/conversation.types";

class TemplateService {
  public createSpecialtyConfirmation(
    specialty: string,
    explanation: string
  ): WhatsAppTemplate {
    return {
      name: "specialty_confirmation",
      language: "fr",
      components: [
        {
          type: "body",
          parameters: [
            { type: "text", text: specialty },
            { type: "text", text: explanation },
          ],
        },
        {
          type: "button",
          parameters: [
            { type: "text", text: "Oui, c'est ça" },
            { type: "text", text: "Non, autre chose" },
          ],
        },
      ],
    };
  }

  public createDoctorProposal(
    doctorName: string,
    specialty: string,
    address: string,
    date: string,
    time: string,
    explanation: string
  ): WhatsAppTemplate {
    return {
      name: "doctor_proposal",
      language: "fr",
      components: [
        {
          type: "body",
          parameters: [
            { type: "text", text: doctorName },
            { type: "text", text: specialty },
            { type: "text", text: address },
            { type: "text", text: `${date} à ${time}` },
            { type: "text", text: explanation },
          ],
        },
        {
          type: "button",
          parameters: [
            { type: "text", text: "Confirmer" },
            { type: "text", text: "Autre horaire" },
            { type: "text", text: "Autre médecin" },
          ],
        },
      ],
    };
  }

  public createAppointmentConfirmation(
    doctorName: string,
    date: string,
    time: string,
    address: string
  ): WhatsAppTemplate {
    return {
      name: "appointment_confirmation",
      language: "fr",
      components: [
        {
          type: "body",
          parameters: [
            { type: "text", text: doctorName },
            { type: "text", text: `${date} à ${time}` },
            { type: "text", text: address },
          ],
        },
      ],
    };
  }
}

export const templateService = new TemplateService();
