import { query } from '../config/db.js';

// In-memory fallback if DB is not configured yet
let memoryNotes = [
  { id: 1, title: 'HTML Email Templates', body: 'Onboarding, Newsletter, Follow-up styles.', category: 'Template', pinned: true, created_at: new Date().toISOString() },
  { id: 2, title: 'Marketing Ideas', body: 'Quarterly HTML newsletter with product updates and discount CTA buttons.', category: 'Work', pinned: false, created_at: new Date().toISOString() },
  { id: 3, title: 'API Endpoints', body: 'POST /api/v1/emails/send, GET /api/v1/notes', category: 'Ideas', pinned: false, created_at: new Date().toISOString() },
];

export const getNotes = async (req, res, next) => {
  try {
    const { category, search } = req.query;

    if (!process.env.DATABASE_URL) {
      let filtered = [...memoryNotes];
      if (category && category !== 'All') {
        filtered = filtered.filter(n => n.category.toLowerCase() === category.toLowerCase());
      }
      if (search) {
        filtered = filtered.filter(n =>
          n.title.toLowerCase().includes(search.toLowerCase()) ||
          n.body.toLowerCase().includes(search.toLowerCase())
        );
      }
      return res.json({ success: true, count: filtered.length, data: filtered, isMock: true });
    }

    let sql = 'SELECT * FROM notes WHERE 1=1';
    const params = [];

    if (category && category !== 'All') {
      params.push(category);
      sql += ` AND LOWER(category) = LOWER($${params.length})`;
    }

    if (search) {
      params.push(`%${search}%`);
      sql += ` AND (title ILIKE $${params.length} OR body ILIKE $${params.length})`;
    }

    sql += ' ORDER BY pinned DESC, created_at DESC';

    const { rows } = await query(sql, params);
    res.json({ success: true, count: rows.length, data: rows });
  } catch (error) {
    next(error);
  }
};

export const createNote = async (req, res, next) => {
  try {
    const { title, body, category = 'Work', pinned = false } = req.body;

    if (!title || !body) {
      return res.status(400).json({ success: false, message: 'Title and body are required' });
    }

    if (!process.env.DATABASE_URL) {
      const newNote = {
        id: Date.now(),
        title,
        body,
        category,
        pinned: Boolean(pinned),
        created_at: new Date().toISOString(),
      };
      memoryNotes.unshift(newNote);
      return res.status(201).json({ success: true, message: 'Note created (in-memory)', data: newNote });
    }

    const sql = `
      INSERT INTO notes (title, body, category, pinned)
      VALUES ($1, $2, $3, $4)
      RETURNING *;
    `;
    const { rows } = await query(sql, [title, body, category, pinned]);

    res.status(201).json({ success: true, message: 'Note created successfully', data: rows[0] });
  } catch (error) {
    next(error);
  }
};

export const updateNote = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { title, body, category, pinned } = req.body;

    if (!process.env.DATABASE_URL) {
      const index = memoryNotes.findIndex(n => n.id == id);
      if (index === -1) {
        return res.status(404).json({ success: false, message: 'Note not found' });
      }
      memoryNotes[index] = {
        ...memoryNotes[index],
        ...(title !== undefined && { title }),
        ...(body !== undefined && { body }),
        ...(category !== undefined && { category }),
        ...(pinned !== undefined && { pinned: Boolean(pinned) }),
        updated_at: new Date().toISOString(),
      };
      return res.json({ success: true, message: 'Note updated (in-memory)', data: memoryNotes[index] });
    }

    const sql = `
      UPDATE notes
      SET title = COALESCE($1, title),
          body = COALESCE($2, body),
          category = COALESCE($3, category),
          pinned = COALESCE($4, pinned),
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $5
      RETURNING *;
    `;
    const { rows } = await query(sql, [title, body, category, pinned, id]);

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Note not found' });
    }

    res.json({ success: true, message: 'Note updated successfully', data: rows[0] });
  } catch (error) {
    next(error);
  }
};

export const deleteNote = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!process.env.DATABASE_URL) {
      const initialLen = memoryNotes.length;
      memoryNotes = memoryNotes.filter(n => n.id != id);
      if (memoryNotes.length === initialLen) {
        return res.status(404).json({ success: false, message: 'Note not found' });
      }
      return res.json({ success: true, message: 'Note deleted (in-memory)' });
    }

    const { rowCount } = await query('DELETE FROM notes WHERE id = $1', [id]);

    if (rowCount === 0) {
      return res.status(404).json({ success: false, message: 'Note not found' });
    }

    res.json({ success: true, message: 'Note deleted successfully' });
  } catch (error) {
    next(error);
  }
};
