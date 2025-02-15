import { twilioClient } from "../config/twilio";
import { conversationService } from "./conversation.service";
import { doctorService } from "./doctor.service";
import { whatsAppService } from "./whatsapp.service";
import { dateService } from "./date.service";
import { semanticService } from "./semantic.service";
import { templateService } from "./template.service";
import { ConversationState } from "../types/conversation.types";

const handleWelcomeStep = async (state: ConversationState): Promise<string> => {
  conversationService.updateConversationState(state.userId, {
    step: "ASKING_SPECIALTY",
  });
  return "Bonjour ! Je suis votre assistant médical. Quel est votre problème ou quelle spécialité recherchez-vous ?";
};

const handleSpecialtyStep = async (
  state: ConversationState,
  messageBody: string,
  from: string,
  to: string
): Promise<string> => {
  // Utiliser Mistral pour analyser la spécialité
  const analysis = await semanticService.analyzeSpecialty(messageBody);
  console.log("Spécialité identifiée:", analysis);

  const doctors = doctorService.findDoctorsBySpecialty(analysis.specialty);

  if (doctors.length === 0) {
    return "Désolé, je ne trouve pas de médecin pour cette spécialité. Pouvez-vous décrire votre problème différemment ?";
  }

  // Envoyer le template de confirmation de spécialité
  const template = templateService.createSpecialtyConfirmation(
    analysis.specialty,
    analysis.explanation
  );

  await whatsAppService.sendTemplateMessage(from, to, template);

  conversationService.updateConversationState(state.userId, {
    specialty: analysis.specialty,
    step: "CONFIRMING_SPECIALTY",
  });

  return ""; // La réponse est gérée par le template
};

const handleSpecialtyConfirmation = async (
  state: ConversationState,
  messageBody: string
): Promise<string> => {
  const response = messageBody.trim().toLowerCase();

  if (response === "oui" || response.includes("c'est ça")) {
    conversationService.updateConversationState(state.userId, {
      step: "ASKING_DATE",
    });
    return "Pour quelle date souhaitez-vous prendre rendez-vous ? Vous pouvez dire par exemple 'dès que possible', 'demain', ou donner une date précise.";
  } else {
    conversationService.updateConversationState(state.userId, {
      step: "ASKING_SPECIALTY",
      specialty: null,
    });
    return "D'accord, pouvez-vous me décrire à nouveau votre problème ou la spécialité recherchée ?";
  }
};

const handleDateStep = async (
  state: ConversationState,
  messageBody: string,
  from: string,
  to: string
): Promise<string> => {
  // Utiliser Mistral pour analyser la date
  const dateAnalysis = await semanticService.analyzeDate(messageBody);
  const parsedDate = new Date(`${dateAnalysis.date}T${dateAnalysis.time}`);

  if (!dateService.isValidDate(parsedDate)) {
    return "Je n'ai pas compris la date. Pouvez-vous la reformuler ? Par exemple: 'demain', 'la semaine prochaine', ou une date précise.";
  }

  const availableDoctors = doctorService.getAvailableDoctors(
    state.specialty!,
    parsedDate
  );

  if (availableDoctors.length === 0) {
    // Si aucun médecin n'est disponible à cette date, chercher la prochaine date disponible
    let nextDate = new Date(parsedDate);
    let found = false;
    for (let i = 0; i < 14; i++) {
      nextDate.setDate(nextDate.getDate() + 1);
      const doctors = doctorService.getAvailableDoctors(
        state.specialty!,
        nextDate
      );
      if (doctors.length > 0) {
        found = true;
        const formattedDate = dateService.formatDate(nextDate);
        return `Désolé, aucun médecin n'est disponible à la date demandée. Le prochain créneau disponible est le ${formattedDate}. Cela vous convient-il ? (Répondez par Oui ou Non)`;
      }
    }
    if (!found) {
      return "Désolé, aucun médecin n'est disponible dans les 14 prochains jours. Voulez-vous essayer une autre spécialité ?";
    }
  }

  // Utiliser Mistral pour choisir le meilleur médecin
  const bestDoctorId = await semanticService.suggestBestDoctor(
    availableDoctors,
    messageBody
  );
  const doctor =
    availableDoctors.find((d) => d.id === bestDoctorId) || availableDoctors[0];

  conversationService.updateConversationState(state.userId, {
    preferredDate: parsedDate.toISOString(),
    selectedDoctor: doctor,
    step: "PROPOSING_DOCTOR",
  });

  // Envoyer le template avec les informations du médecin
  const template = templateService.createDoctorProposal(
    doctor.name,
    doctor.specialty,
    doctor.address,
    dateAnalysis.date,
    dateAnalysis.time,
    dateAnalysis.explanation
  );

  await whatsAppService.sendTemplateMessage(from, to, template);

  return ""; // La réponse est gérée par le template
};

const handleDoctorProposalStep = async (
  state: ConversationState,
  messageBody: string,
  from: string,
  to: string
): Promise<string> => {
  const response = messageBody.trim().toLowerCase();

  if (response === "confirmer") {
    const doctor = state.selectedDoctor!;
    const date = new Date(state.preferredDate!);

    conversationService.updateConversationState(state.userId, {
      step: "COMPLETED",
    });

    // Envoyer la confirmation avec la localisation
    const template = templateService.createAppointmentConfirmation(
      doctor.name,
      date.toLocaleDateString("fr-FR"),
      date.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }),
      doctor.address
    );

    await whatsAppService.sendTemplateMessage(from, to, template);

    // Envoyer la localisation du cabinet
    await whatsAppService.sendLocationMessage(
      from,
      to,
      48.8566, // Latitude de Paris pour l'exemple
      2.3522, // Longitude de Paris pour l'exemple
      doctor.name,
      doctor.address
    );

    return ""; // La réponse est gérée par les templates
  } else if (response === "autre horaire") {
    conversationService.updateConversationState(state.userId, {
      step: "ASKING_DATE",
    });
    return "D'accord, pour quelle autre date souhaitez-vous prendre rendez-vous ?";
  } else {
    conversationService.resetConversation(state.userId);
    return "D'accord, recommençons. Quel est votre problème ou quelle spécialité recherchez-vous ?";
  }
};

export const handleMessage = async (
  messageBody: string,
  From: string,
  To: string
): Promise<string> => {
  try {
    const userId = From;

    // Vérifier si c'est une commande de reset
    if (conversationService.shouldResetConversation(messageBody)) {
      conversationService.resetConversation(userId);
      return "Conversation réinitialisée. Comment puis-je vous aider ?";
    }

    let state =
      conversationService.getConversationState(userId) ||
      conversationService.initializeConversation(userId);

    let response: string;

    switch (state.step) {
      case "WELCOME":
        response = await handleWelcomeStep(state);
        break;
      case "ASKING_SPECIALTY":
        response = await handleSpecialtyStep(state, messageBody, From, To);
        break;
      case "CONFIRMING_SPECIALTY":
        response = await handleSpecialtyConfirmation(state, messageBody);
        break;
      case "ASKING_DATE":
        response = await handleDateStep(state, messageBody, From, To);
        break;
      case "PROPOSING_DOCTOR":
        response = await handleDoctorProposalStep(state, messageBody, From, To);
        break;
      case "COMPLETED":
        conversationService.resetConversation(userId);
        response =
          "Merci d'avoir utilisé notre service. Comment puis-je vous aider aujourd'hui ?";
        break;
      default:
        response = "Désolé, je n'ai pas compris. Pouvez-vous reformuler ?";
    }

    if (response) {
      // Envoyer la réponse via WhatsApp seulement si elle n'est pas vide
      const message = await twilioClient.messages.create({
        body: response,
        from: To,
        to: From,
      });
      console.log("Message envoyé avec succès:", message.sid);
    }

    return "Message traité avec succès";
  } catch (error) {
    console.error("Erreur lors de l'envoi du message:", error);
    throw error;
  }
};
