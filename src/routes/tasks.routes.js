import { Router } from 'express';
import { getTasks, createTask, updateTask, deleteTask } from '../controllers/tasks.controller.js';

const router = Router();

router.route('/')
  .get(getTasks)
  .post(createTask);

router.route('/:id')
  .put(updateTask)
  .delete(deleteTask);

export default router;
