import { twilioClient, twilioPhoneNumber } from '../config/twilio';
import { getMistralResponse } from '../config/mistral';

export const handleMessage = async (messageBody: string, from: string): Promise<string> => {
  try {
    // Obtenir la réponse de l'IA
    console.log('Message reçu:', messageBody);
    const aiResponse = await getMistralResponse(messageBody);
    console.log('Réponse IA:', aiResponse);

    console.log('Configuration Twilio:', {
      twilioPhoneNumber,
      destinationNumber: from,
      messageBody: aiResponse
    });

    // Envoyer la réponse via WhatsApp
    const message = await twilioClient.messages.create({
      body: aiResponse,
      from: twilioPhoneNumber, // Utilisation directe de la variable d'environnement
      to: from
    });

    console.log('Message envoyé avec succès:', message.sid);
    return 'Message traité avec succès';
  } catch (error) {
    console.error('Erreur lors de l\'envoi du message:', error);
    throw error;
  }
}; 
