import { twilioClient, twilioPhoneNumber } from '../config/twilio';
import { getMistralResponse } from '../config/mistral';

export const handleMessage = async (messageBody: string, from: string): Promise<string> => {
  try {
    // Obtenir la réponse de l'IA
    console.log('Message reçu:', messageBody);
    const aiResponse = await getMistralResponse(messageBody);
    console.log('Réponse IA:', aiResponse);

    // Utiliser le numéro WhatsApp sandbox de Twilio
    const twilioWhatsAppSandbox = 'whatsapp:+14155238886';
    console.log('Envoi depuis:', twilioWhatsAppSandbox, 'vers:', from);

    // Envoyer la réponse via WhatsApp
    await twilioClient.messages.create({
      body: aiResponse,
      from: twilioWhatsAppSandbox,
      to: from
    });

    return 'Message traité avec succès';
  } catch (error) {
    console.error('Erreur lors de l\'envoi du message:', error);
    throw error;
  }
}; 
