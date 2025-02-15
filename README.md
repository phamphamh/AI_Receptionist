# Sona Backend

Sona Backend est une application Node.js/TypeScript qui sert de backend pour le projet Sona, intégrant des services de communication via Twilio.

## 🚀 Technologies Utilisées

- Node.js
- TypeScript
- Express.js
- Twilio
- dotenv (pour la gestion des variables d'environnement)

## 📋 Prérequis

- Node.js (version 14 ou supérieure)
- npm ou yarn
- Un compte Twilio avec les identifiants nécessaires
- ngrok (pour les tests en local)

## 🛠 Installation et Configuration

1. **Cloner et installer les dépendances**
```bash
git clone https://github.com/phamphamh/AI_Receptionist.git
cd sona-backend
npm install
```

2. **Configuration des variables d'environnement**
Créez un fichier `.env` à la racine du projet avec :
```bash
PORT=3000
TWILIO_ACCOUNT_SID=votre_account_sid
TWILIO_AUTH_TOKEN=votre_auth_token
TWILIO_PHONE_NUMBER=votre_numero_twilio
```

## 🚀 Lancement en Local

1. **Démarrer le serveur**
```bash
npm run dev
```

2. **Exposer le serveur avec ngrok** (dans un nouveau terminal)
```bash
ngrok http 3000
```

3. **Configuration Twilio**
- Accédez à la [console Twilio](https://console.twilio.com)
- Allez dans "Phone Numbers" > Votre numéro
- Dans la section "Messaging"
- Configurez "When a message comes in" avec :
  - URL : `https://votre-url-ngrok/api/sms`
  - Méthode : POST

## 🧪 Test

**Test local avec curl :**
```bash
curl -X POST http://localhost:3000/api/sms \
-H "Content-Type: application/json" \
-d '{"Body": "Bonjour", "From": "+33612345678"}'
```

## 📁 Structure du Projet

```
sona-backend/
├── src/
│   ├── config/
│   │   └── twilio.ts      # Configuration Twilio
│   ├── controllers/
│   │   └── webhook.controller.ts  # Gestion des webhooks
│   ├── routes/
│   │   └── webhook.routes.ts      # Définition des routes
│   ├── services/
│   │   └── twilio.service.ts      # Logique Twilio
│   └── app.ts             # Point d'entrée
├── .env                   # Variables d'environnement
├── package.json          
├── tsconfig.json         # Configuration TypeScript
└── README.md
```

## 🔄 Scripts Disponibles

- `npm run dev` : Lance le serveur en mode développement
- `npm run build` : Compile le projet TypeScript
- `npm start` : Lance le serveur en production

## 🚧 Fonctionnalités Actuelles

- Réception de SMS via webhook Twilio
- Réponse automatique aux SMS reçus
- Gestion des erreurs basique

## 📈 Améliorations Prévues

1. Tests unitaires
2. Amélioration de la gestion des erreurs
3. Validation des requêtes
4. Logs détaillés
5. Documentation API (Swagger)

## 📄 Licence

ISC

## 👥 Auteur

[Votre nom] 
