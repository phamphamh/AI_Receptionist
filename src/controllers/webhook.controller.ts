import { Request, Response } from 'express';
import { WhatsAppService } from '../services/whatsapp.service';

export class WebhookController {
  static async handleWebhook(req: Request, res: Response) {
    try {
      const response = await WhatsAppService.handleIncomingMessage(req.body);
      res.json(response);
    } catch (error) {
      console.error('Webhook error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }

  static async healthCheck(req: Request, res: Response) {
    res.json({ status: 'healthy' });
  }
} 
