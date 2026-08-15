import { query } from '../config/db.js';

let memoryTasks = [
  { id: 1, title: 'Design Email Template', priority: 'High', done: false, due: 'Today', tag: 'Design' },
  { id: 2, title: 'Set up n8n Webhook Integration', priority: 'High', done: false, due: 'Today', tag: 'Dev' },
  { id: 3, title: 'Review Marketing Copy', priority: 'Normal', done: true, due: 'Aug 13', tag: 'Work' },
  { id: 4, title: 'Update App Icons & Splash', priority: 'Low', done: false, due: 'Aug 15', tag: 'Design' },
];

export const getTasks = async (req, res, next) => {
  try {
    if (!process.env.DATABASE_URL) {
      return res.json({ success: true, count: memoryTasks.length, data: memoryTasks });
    }
    const { rows } = await query('SELECT * FROM tasks ORDER BY done ASC, id DESC');
    res.json({ success: true, count: rows.length, data: rows });
  } catch (error) {
    next(error);
  }
};

export const createTask = async (req, res, next) => {
  try {
    const { title, priority = 'Normal', due = 'Today', tag = 'Work' } = req.body;
    if (!title) {
      return res.status(400).json({ success: false, message: 'Title is required' });
    }

    if (!process.env.DATABASE_URL) {
      const newTask = { id: Date.now(), title, priority, done: false, due, tag };
      memoryTasks.unshift(newTask);
      return res.status(201).json({ success: true, data: newTask });
    }

    const sql = `
      INSERT INTO tasks (title, priority, done, due, tag)
      VALUES ($1, $2, false, $3, $4)
      RETURNING *;
    `;
    const { rows } = await query(sql, [title, priority, due, tag]);
    res.status(201).json({ success: true, data: rows[0] });
  } catch (error) {
    next(error);
  }
};

export const updateTask = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { title, priority, done, due, tag } = req.body;

    if (!process.env.DATABASE_URL) {
      const index = memoryTasks.findIndex(t => t.id == id);
      if (index === -1) return res.status(404).json({ success: false, message: 'Task not found' });
      memoryTasks[index] = {
        ...memoryTasks[index],
        ...(title !== undefined && { title }),
        ...(priority !== undefined && { priority }),
        ...(done !== undefined && { done: Boolean(done) }),
        ...(due !== undefined && { due }),
        ...(tag !== undefined && { tag }),
      };
      return res.json({ success: true, data: memoryTasks[index] });
    }

    const sql = `
      UPDATE tasks
      SET title = COALESCE($1, title),
          priority = COALESCE($2, priority),
          done = COALESCE($3, done),
          due = COALESCE($4, due),
          tag = COALESCE($5, tag)
      WHERE id = $6
      RETURNING *;
    `;
    const { rows } = await query(sql, [title, priority, done, due, tag, id]);
    if (rows.length === 0) return res.status(404).json({ success: false, message: 'Task not found' });
    res.json({ success: true, data: rows[0] });
  } catch (error) {
    next(error);
  }
};

export const deleteTask = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!process.env.DATABASE_URL) {
      memoryTasks = memoryTasks.filter(t => t.id != id);
      return res.json({ success: true, message: 'Task deleted' });
    }
    await query('DELETE FROM tasks WHERE id = $1', [id]);
    res.json({ success: true, message: 'Task deleted' });
  } catch (error) {
    next(error);
  }
};
