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

export const check_if_med_request = async (message: string): Promise<string> => {
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
            content: `Check if the following message indicates that the patient needs or wants to see a doctor. 
                      If the message implies that the patient needs or wants to see a doctor, return "true". 
                      If the message does not imply that the patient needs or wants to see a doctor, return "false". 
                      Only return strictly one word: "true" or "false". 
                      Never explain your choice, only respond one word.
                      Message: ${message}`
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

export const answer_health_question = async (message: string): Promise<string> => {
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
              content: `
                        Only respond in the following three ways:

                        1. If the question is a general health-related question, provide a response that addresses the query. Make sure to clearly state that you are an AI-based tool and not a licensed doctor.
                        
                        2. For any other queries, respond with: "I'm sorry, I can't help with that. I am 'Hey Doc,' your AI assistant designed to assist you with health concerns and scheduling doctor appointments."

                        3. All responses must be in the language of the original message. Ensure the language of the reply matches the language of the question.
                        Message: ${message}`
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

const main = async () => {
    const args = process.argv.slice(2);
    if (args.length === 0) {
      console.error('Please provide a message as an argument.');
      process.exit(1);
    }
  
    const message = args.join(' ');
  const response = await check_if_med_request(message);
  const wantsDoctor = response === 'true';

  if (wantsDoctor) {
    console.log('Ok I suggest you to take a medical appointment');
  } else {
    const question_response = await answer_health_question(message);
    console.log(question_response);
  }
  };
  
  main();