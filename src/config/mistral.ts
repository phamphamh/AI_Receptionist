import dotenv from 'dotenv';
import fetch from 'node-fetch';

dotenv.config();

const MISTRAL_API_KEY = process.env.MISTRAL_API_KEY;
const MISTRAL_API_URL = 'https://api.mistral.ai/v1/chat/completions';

if (!MISTRAL_API_KEY) {
  throw new Error('Missing Mistral API configuration');
}

interface MistralResponse {
  choices: Array<{
    message: {
      content: string;
    };
  }>;
}

export const getMistralResponse = async (message: string): Promise<string> => {
  try {
    const response = await fetch(MISTRAL_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${MISTRAL_API_KEY}`
      },
      body: JSON.stringify({
        model: 'mistral-tiny',
        messages: [
          {
            role: 'system',
            content: 'Vous êtes un assistant virtuel professionnel et sympathique. Répondez de manière concise et utile.'
          },
          {
            role: 'user',
            content: message
          }
        ],
        max_tokens: 150
      })
    });

    if (!response.ok) {
      throw new Error(`Erreur API Mistral: ${response.status}`);
    }

    const data = await response.json() as MistralResponse;
    return data.choices[0].message.content;
  } catch (error) {
    console.error('Erreur lors de l\'appel à Mistral API:', error);
    return 'Désolé, je rencontre des difficultés techniques. Veuillez réessayer plus tard.';
  }
};

// Modèle par défaut pour notre assistant médical
export const DEFAULT_MODEL = 'mistral-medium'; 
