import { Router } from 'express';
import {
  getDrivingLessonsProgress,
  updateDrivingLessonsProgress,
  resetDrivingLessonsProgress,
} from '../controllers/drivingLessons.controller.js';

const router = Router();

router.get('/', getDrivingLessonsProgress);
router.put('/', updateDrivingLessonsProgress);
router.post('/reset', resetDrivingLessonsProgress);

export default router;
