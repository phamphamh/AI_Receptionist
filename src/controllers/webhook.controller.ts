import { Request, Response } from "express";
import { twilioClient } from "../config/twilio";
import { handleMessage } from "../services/twilio.service";

export const handleIncomingMessage = async (req: Request, res: Response) => {
    try {
        console.log(
            "Requête complète reçue:",
            JSON.stringify(req.body, null, 2)
        );
        const { Body, From, To } = req.body;
        const response = await handleMessage(Body, From, To);
        res.status(200).send(response);
    } catch (error) {
        console.error("Erreur lors du traitement du message:", error);
        res.status(500).send("Erreur interne du serveur");
    }
};
