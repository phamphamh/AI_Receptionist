import { twilioClient } from "../config/twilio";
import { WhatsAppTemplate } from "../types/conversation.types";

/**
 * Service de gestion des messages WhatsApp
 * Gère l'envoi de messages via l'API Twilio WhatsApp
 */
class WhatsAppService {
  /**
   * Envoie un message template via WhatsApp
   * Dans le sandbox, convertit les templates en messages texte simples
   * @param to - Numéro du destinataire
   * @param from - Numéro Twilio
   * @param template - Template de message avec paramètres
   * @returns ID du message envoyé
   */
  public async sendTemplateMessage(
    to: string,
    from: string,
    template: WhatsAppTemplate
  ): Promise<string> {
    try {
      console.log("Envoi du message WhatsApp:", { to, from, template });
      // Pour le sandbox, on utilise des messages texte simples au lieu des templates
      const message = await twilioClient.messages.create({
        to,
        from,
        body: this.convertTemplateToText(template),
      });
      console.log("Message envoyé avec succès:", message.sid);
      return message.sid;
    } catch (error) {
      console.error("Erreur lors de l'envoi du message WhatsApp:", error);
      throw error;
    }
  }

  /**
   * Convertit un template en texte simple pour le sandbox WhatsApp
   * @param template - Template à convertir
   * @returns Texte formaté
   */
  private convertTemplateToText(template: WhatsAppTemplate): string {
    let text = "";

    // Convertir les paramètres du corps en texte
    if (template.components) {
      const bodyComponent = template.components.find((c) => c.type === "body");
      if (bodyComponent) {
        text = bodyComponent.parameters.map((p) => p.text).join("\n");
      }
    }

    // Ajouter les boutons comme options
    const buttonComponent = template.components?.find(
      (c) => c.type === "button"
    );
    if (buttonComponent) {
      text += "\n\nOptions disponibles:\n";
      text += buttonComponent.parameters.map((p) => `- ${p.text}`).join("\n");
    }

    return text;
  }

  public async sendLocationMessage(
    to: string,
    from: string,
    latitude: number,
    longitude: number,
    name: string,
    address: string
  ): Promise<string> {
    try {
      // Pour le sandbox, envoyer l'adresse en texte
      const message = await twilioClient.messages.create({
        from,
        to,
        body: `📍 ${name}\n${address}\nLocalisation : ${latitude}, ${longitude}`,
      });
      return message.sid;
    } catch (error) {
      console.error("Erreur lors de l'envoi de la localisation:", error);
      throw error;
    }
  }

  public async sendDoctorProposal(
    to: string,
    from: string,
    doctorName: string,
    specialty: string,
    address: string,
    date: string
  ): Promise<string> {
    const text =
      `Proposition de rendez-vous :\n\n` +
      `Dr. ${doctorName}\n` +
      `Spécialité : ${specialty}\n` +
      `Adresse : ${address}\n` +
      `Date : ${date}\n\n` +
      `Options :\n` +
      `- Confirmer\n` +
      `- Autre horaire\n` +
      `- Autre médecin`;

    return this.sendTemplateMessage(to, from, {
      name: "doctor_proposal",
      language: "fr",
      components: [
        {
          type: "body",
          parameters: [{ type: "text", text }],
        },
      ],
    });
  }

  /**
   * Envoie une confirmation de rendez-vous avec la localisation
   * Combine la confirmation et l'adresse en un seul message pour éviter les limites du sandbox
   */
  public async sendAppointmentConfirmation(
    to: string,
    from: string,
    doctorName: string,
    date: string,
    address: string
  ): Promise<string> {
    const text =
      `✅ Rendez-vous confirmé !\n\n` +
      `Dr. ${doctorName}\n` +
      `Date : ${date}\n` +
      `Adresse : ${address}\n\n` +
      `📍 Localisation du cabinet :\n` +
      `${address}`;

    return this.sendTemplateMessage(to, from, {
      name: "appointment_confirmation",
      language: "fr",
      components: [
        {
          type: "body",
          parameters: [{ type: "text", text }],
        },
      ],
    });
  }
}

export const whatsAppService = new WhatsAppService();
