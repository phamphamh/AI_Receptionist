import { mistralClient, DEFAULT_MODEL } from '../config/mistral';

export class AIService {
  static async analyzeMessage(message: string) {
    try {
      const response = await mistralClient.chat({
        model: DEFAULT_MODEL,
        messages: [
          {
            role: 'system',
            content: 'Vous êtes Sona, un assistant médical professionnel et bienveillant. Votre rôle est d\'aider les patients à prendre des rendez-vous médicaux et à répondre à leurs questions de manière claire et rassurante.'
          },
          {
            role: 'user',
            content: message
          }
        ]
      });

      return {
        success: true,
        response: response.choices[0].message.content,
        intent: this.detectIntent(message)
      };
    } catch (error) {
      console.error('Error analyzing message with Mistral:', error);
      return {
        success: false,
        error: 'Failed to analyze message'
      };
    }
  }

  private static detectIntent(message: string): string {
    const message_lower = message.toLowerCase();
    
    if (message_lower.includes('rendez-vous') || message_lower.includes('rdv')) {
      return 'appointment';
    }
    if (message_lower.includes('annuler')) {
      return 'cancel';
    }
    if (message_lower.includes('modifier')) {
      return 'modify';
    }
    
    return 'general_query';
  }
} 
