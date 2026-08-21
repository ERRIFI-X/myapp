import { Router } from 'express';
import {
  getInscriptionsProgress,
  updateInscriptionsProgress,
  resetInscriptionsProgress,
} from '../controllers/inscriptions.controller.js';

const router = Router();

router.get('/', getInscriptionsProgress);
router.put('/', updateInscriptionsProgress);
router.post('/reset', resetInscriptionsProgress);

export default router;
