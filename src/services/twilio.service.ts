import { twilioClient, twilioPhoneNumber } from '../config/twilio';

export const handleMessage = async (messageBody: string, from: string): Promise<string> => {
  try {
    // Envoyer une réponse via SMS
    await twilioClient.messages.create({
      body: `Merci pour votre message: "${messageBody}". Notre assistant va vous répondre bientôt.`,
      from: twilioPhoneNumber,
      to: from
    });

    return 'Message traité avec succès';
  } catch (error) {
    console.error('Erreur lors de l\'envoi du message:', error);
    throw error;
  }
}; 
