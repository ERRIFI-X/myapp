import { Router } from 'express';
import healthRoutes from './health.routes.js';
import notesRoutes from './notes.routes.js';
import emailRoutes from './email.routes.js';
import tasksRoutes from './tasks.routes.js';
import drivingLessonsRoutes from './drivingLessons.routes.js';

const router = Router();

router.use('/health', healthRoutes);
router.use('/notes', notesRoutes);
router.use('/emails', emailRoutes);
router.use('/tasks', tasksRoutes);
router.use('/driving-lessons', drivingLessonsRoutes);

export default router;
