# Sona - Assistant Médical Intelligent

Sona est une application de prise de rendez-vous médicaux composée de trois parties principales :

- Une landing page moderne
- Un chatbot web intelligent
- Un backend qui gère la logique métier et l'intégration avec WhatsApp

## 🚀 Architecture du Projet

Le projet est structuré en trois composants principaux :

```
sona-backend/
├── front-end copie/     # Landing page (Next.js)
├── frontend/           # Chatbot web (Next.js)
└── src/               # Backend (Node.js/Express)
```

### Ports par défaut

- Backend : 3000
- Landing page : 3001
- Chatbot : 3002

## 📋 Prérequis

- Node.js (v14 ou supérieur)
- npm ou yarn
- Compte Twilio (pour l'intégration WhatsApp)
- Compte OpenAI
- Compte Mistral AI

## ⚙️ Configuration

1. **Variables d'environnement**

Créez un fichier `.env` à la racine du projet avec la structure suivante :

```env
# Server Configuration
PORT=3000

# Twilio Configuration
TWILIO_ACCOUNT_SID=votre_account_sid
TWILIO_AUTH_TOKEN=votre_auth_token
TWILIO_PHONE_NUMBER=whatsapp:+1234567890

# Mistral AI Configuration
MISTRAL_API_KEY=votre_mistral_api_key

# OpenAI Configuration
OPENAI_API_KEY=votre_openai_api_key
```

2. **Installation des dépendances**

Pour le backend :

```bash
cd sona-backend
npm install
```

Pour la landing page :

```bash
cd "front-end copie"
npm install
```

Pour le chatbot :

```bash
cd frontend
npm install
```

## 🚀 Lancement

1. **Backend**

```bash
cd sona-backend
npm run dev
```

2. **Landing Page**

```bash
cd "front-end copie"
npm run dev
```

3. **Chatbot**

```bash
cd frontend
npm run dev
```

## 📁 Structure des Répertoires

### Backend (src/)

```
src/
├── config/           # Configuration (Twilio, OpenAI, Mistral)
├── controllers/      # Contrôleurs
├── routes/          # Routes API
├── services/        # Services métier
└── lib/             # Utilitaires et helpers
```

### Landing Page (front-end copie/)

```
front-end copie/
├── app/             # Pages Next.js
├── components/      # Composants React
├── lib/             # Utilitaires
└── public/          # Assets statiques
```

### Chatbot (frontend/)

```
frontend/
├── app/             # Pages Next.js
├── components/      # Composants React
├── hooks/           # Hooks personnalisés
└── types/           # Types TypeScript
```

## 🔄 Flux de Communication

1. **Via WhatsApp**

   - L'utilisateur envoie un message sur WhatsApp
   - Twilio transmet le message au backend
   - Le backend utilise Mistral AI pour générer une réponse
   - La réponse est envoyée à l'utilisateur via WhatsApp

2. **Via le Chatbot Web**
   - L'utilisateur interagit avec le chatbot
   - Les messages sont traités par le backend
   - Les réponses sont générées avec Mistral AI
   - Support pour les messages texte et audio

## 🛠 Technologies Utilisées

- **Frontend** : Next.js, TypeScript, Tailwind CSS
- **Backend** : Node.js, Express, TypeScript
- **IA** : Mistral AI, OpenAI (pour la transcription audio)
- **Communication** : Twilio (WhatsApp)

## 📝 Fonctionnalités

- Prise de rendez-vous via WhatsApp ou chatbot web
- Interface utilisateur moderne et responsive
- Support multilingue
- Transcription audio vers texte
- Géolocalisation des cabinets médicaux
- Gestion intelligente des rendez-vous

## 🤝 Contribution

1. Fork le projet
2. Créez votre branche (`git checkout -b feature/AmazingFeature`)
3. Committez vos changements (`git commit -m 'Add some AmazingFeature'`)
4. Push vers la branche (`git push origin feature/AmazingFeature`)
5. Ouvrez une Pull Request

## 📄 Licence

Ce projet est sous licence MIT. Voir le fichier `LICENSE` pour plus de détails.
