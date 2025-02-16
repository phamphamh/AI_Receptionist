# Sona - Intelligent Medical Assistant

Sona is a medical appointment scheduling application composed of three main parts:

- A modern landing page
- An intelligent web chatbot
- A backend that handles business logic and integrates with WhatsApp

---

## 🚀 Project Architecture

The project is structured into three main components:

```
sona-backend/
├── front-end copy/     # Landing page (Next.js)
├── frontend/           # Web chatbot (Next.js)
└── src/               # Backend (Node.js/Express)
```

### Default Ports
- **Backend**: `3000`
- **Landing Page**: `3001`
- **Chatbot**: `3002`

---

## 📋 Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- Twilio account (for WhatsApp integration)
- OpenAI account
- Mistral AI account

---

## ⚙️ Configuration

### Environment Variables
Create a `.env` file at the project root with the following structure:

```
# Server Configuration
PORT=3000

# Twilio Configuration
TWILIO_ACCOUNT_SID=your_account_sid
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_PHONE_NUMBER=whatsapp:+1234567890

# Mistral AI Configuration
MISTRAL_API_KEY=your_mistral_api_key

# OpenAI Configuration
OPENAI_API_KEY=your_openai_api_key
```

---

## 💾 Installation

### Backend
```sh
cd sona-backend
npm install
```

### Landing Page
```sh
cd "front-end copy"
npm install
```

### Chatbot
```sh
cd frontend
npm install
```

---

## 🚀 Running the Project

### Backend
```sh
cd sona-backend
npm run dev
```

### Landing Page
```sh
cd "front-end copy"
npm run dev
```

### Chatbot
```sh
cd frontend
npm run dev
```

---

## 📁 Directory Structure

### Backend (`src/`)
```
src/
├── config/         # Configuration (Twilio, OpenAI, Mistral)
├── controllers/    # Controllers
├── routes/        # API routes
├── services/      # Business logic services
└── lib/           # Utilities and helpers
```

### Landing Page (`front-end copy/`)
```
front-end copy/
├── app/          # Next.js pages
├── components/   # React components
├── lib/          # Utilities
└── public/       # Static assets
```

### Chatbot (`frontend/`)
```
frontend/
├── app/          # Next.js pages
├── components/   # React components
├── hooks/        # Custom hooks
└── types/        # TypeScript types
```

---

## 🔄 Communication Flow

### Via WhatsApp
1. The user sends a message on WhatsApp.
2. Twilio forwards the message to the backend.
3. The backend uses Mistral AI to generate a response.
4. The response is sent back to the user via WhatsApp.

### Via Web Chatbot
1. The user interacts with the chatbot.
2. Messages are processed by the backend.
3. Responses are generated using Mistral AI.
4. Supports both text and voice messages.

---

## 🛠 Technologies Used

- **Frontend**: Next.js, TypeScript, Tailwind CSS
- **Backend**: Node.js, Express, TypeScript
- **AI**: Mistral AI, OpenAI (for audio transcription)
- **Communication**: Twilio (WhatsApp)

---

## 📝 Features

- Schedule medical appointments via WhatsApp or web chatbot.
- Modern and responsive user interface.
- Multilingual support.
- Speech-to-text transcription.
- Medical office geolocation.
- Intelligent appointment management.

---

## 🤝 Contribution

1. Fork the project.
2. Create your branch (`git checkout -b feature/AmazingFeature`).
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`).
4. Push to the branch (`git push origin feature/AmazingFeature`).
5. Open a Pull Request.

---

## 📄 License

This project is licensed under the MIT License. See the `LICENSE` file for more details.

---

🚀 *Developed with passion by the Sona team!*

