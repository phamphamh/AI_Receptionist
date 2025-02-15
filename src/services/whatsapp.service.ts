import { twilioClient, twilioPhoneNumber } from '../config/twilio';
import { AIService } from './ai.service';

export class WhatsAppService {
  static async sendMessage(to: string, message: string) {
    try {
      const response = await twilioClient.messages.create({
        body: message,
        from: `whatsapp:${twilioPhoneNumber}`,
        to: `whatsapp:${to}`
      });

      return {
        success: true,
        messageSid: response.sid
      };
    } catch (error) {
      console.error('Error sending WhatsApp message:', error);
      return {
        success: false,
        error: 'Failed to send message'
      };
    }
  }

  static async handleIncomingMessage(body: any) {
    try {
      const { From, Body } = body;
      
      // Analyser le message avec Mistral AI
      const aiResponse = await AIService.analyzeMessage(Body);
      
      if (!aiResponse.success) {
        return this.sendMessage(
          From.replace('whatsapp:', ''),
          'Désolé, je rencontre des difficultés techniques. Veuillez réessayer plus tard.'
        );
      }

      // Envoyer la réponse générée par l'IA
      const response = await this.sendMessage(
        From.replace('whatsapp:', ''),
        aiResponse.response
      );

      return {
        ...response,
        intent: aiResponse.intent
      };
    } catch (error) {
      console.error('Error handling incoming message:', error);
      return {
        success: false,
        error: 'Failed to handle message'
      };
    }
  }
} 
