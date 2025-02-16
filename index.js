// src/index.js

const { handleAppointmentRequest } = require('./handleAppointmentRequest');

// Simuler la réponse de l'agent conversationnel Mistral
const mistralResponse = {
    "intent": "book_appointment",
    "entities": {
        "doctor": "Dr. Anne Lefevre",
        "date": "2025-03-17T12:18:00",
        "city": "Paris",
        "user_phone": process.env.TWILIO_PHONE_NUMBER
    }
};

handleAppointmentRequest(mistralResponse);