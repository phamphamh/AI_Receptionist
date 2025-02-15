# Sona Backend

Assistant virtuel de prise de rendez-vous médicaux via WhatsApp.

## 🌟 Fonctionnalités

- Prise de rendez-vous médicaux via WhatsApp
- Analyse sémantique des symptômes pour recommander un spécialiste
- Gestion intelligente des dates et créneaux horaires
- Confirmation automatique des rendez-vous
- Interface conversationnelle naturelle en français

## 🛠 Technologies

- Node.js & TypeScript
- Twilio (WhatsApp API)
- Mistral AI (Analyse sémantique)
- ngrok (Tunneling pour le développement)

## 📋 Prérequis

- Node.js (v14 ou supérieur)
- Compte Twilio avec WhatsApp Sandbox activé
- Compte Mistral AI
- ngrok

## ⚙️ Configuration

1. Cloner le repository :

```bash
git clone [URL_DU_REPO]
cd sona-backend
```

2. Installer les dépendances :

```bash
npm install
```

3. Configurer les variables d'environnement dans `.env` :

```env
PORT=3000
TWILIO_ACCOUNT_SID=votre_account_sid
TWILIO_AUTH_TOKEN=votre_auth_token
TWILIO_PHONE_NUMBER=whatsapp:+14155238886
MISTRAL_API_KEY=votre_api_key
```

4. Lancer ngrok :

```bash
ngrok http 3000
```

5. Configurer le webhook Twilio avec l'URL ngrok :
   - URL : `https://votre-url-ngrok.ngrok-free.app/api/sms`
   - Méthode : POST

## 🚀 Démarrage

```bash
# Mode développement
npm run dev

# Mode production
npm run build
npm start
```

## 📱 Utilisation

1. Rejoindre le sandbox WhatsApp en envoyant le code au numéro Twilio
2. Démarrer une conversation en envoyant "Bonjour"
3. Suivre les instructions pour prendre rendez-vous

## 🔄 Flux de conversation

1. Accueil et demande de symptômes/spécialité
2. Confirmation de la spécialité
3. Choix de la date du rendez-vous
4. Proposition de médecin disponible
5. Confirmation du rendez-vous

## 📝 Notes

- Le sandbox WhatsApp a une limite de messages quotidienne
- Les créneaux de rendez-vous sont simulés pour la démo
- L'analyse sémantique est optimisée pour le français

## 🤝 Contribution

Les contributions sont les bienvenues ! N'hésitez pas à ouvrir une issue ou un pull request.

## 📄 Licence

[MIT](LICENSE)
