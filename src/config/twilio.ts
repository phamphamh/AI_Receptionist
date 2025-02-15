import twilio from "twilio";
import dotenv from "dotenv";

dotenv.config();

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const phoneNumber = process.env.TWILIO_PHONE_NUMBER;

if (!accountSid || !authToken || !phoneNumber) {
  throw new Error("Missing Twilio configuration");
}

export const twilioClient = twilio(accountSid, authToken);
export const twilioPhoneNumber = `whatsapp:${phoneNumber}`;
