import { Router } from 'express';
import { WebhookController } from '../controllers/webhook.controller';

const router = Router();

router.post('/webhook', WebhookController.handleWebhook);
router.get('/webhook/health', WebhookController.healthCheck);

export default router; 
