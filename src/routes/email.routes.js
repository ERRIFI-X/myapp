import { Router } from 'express';
import { sendEmail, getEmails, n8nCallback } from '../controllers/email.controller.js';

const router = Router();

router.post('/send', sendEmail);
router.get('/', getEmails);       // Frontend: GET /api/emails
router.get('/logs', getEmails);   // Also accessible as /api/emails/logs
router.post('/n8n-callback', n8nCallback);

export default router;
