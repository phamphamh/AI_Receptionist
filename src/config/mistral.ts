import { MistralClient } from '@mistralai/mistralai';
import dotenv from 'dotenv';

dotenv.config();

const apiKey = process.env.MISTRAL_API_KEY;

if (!apiKey) {
  throw new Error('Missing Mistral API key');
}

export const mistralClient = new MistralClient(apiKey);

// Modèle par défaut pour notre assistant médical
export const DEFAULT_MODEL = 'mistral-medium'; 
