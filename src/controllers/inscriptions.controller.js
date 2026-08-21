import { query } from '../config/db.js';

const PROGRAMS = [
  'Salé',
  'Sidi Bennour',
  'Safi',
  'Essaouira',
  'Fès',
  'Casablanca',
  'Khénifra',
  'Laâyoune',
  'Agadir',
  'Guelmim',
  'Dakhla',
  'Kénitra',
  'Guelmim Centre EL OUATYA TanTan',
  'Guelmim Centre CReFaz - Assa',
  'Agadir Centre Tata',
  'Meknès',
  'Kelaa Sraghna',
  'Fkih Ben Salah',
  'Tétouan',
];

const YEAR = '2026-2027';
const PROGRAM_NAME = 'Bachelor en Technologie EST';
const PROGRESS_KEY = 'default';

const createDefaultItems = () =>
  PROGRAMS.map((city, index) => ({
    id: index + 1,
    city,
    done: false,
  }));

const normalizeItems = (items = []) => {
  const source = Array.isArray(items) ? items : [];

  return createDefaultItems().map((item) => {
    const match = source.find((entry) => Number(entry?.id) === item.id);

    return {
      id: item.id,
      city: item.city,
      done: Boolean(match?.done),
    };
  });
};

const buildSnapshot = (items = []) => {
  const normalizedItems = normalizeItems(items);
  const completedCount = normalizedItems.filter((item) => item.done).length;

  return {
    progressKey: PROGRESS_KEY,
    year: YEAR,
    programName: PROGRAM_NAME,
    totalCount: PROGRAMS.length,
    items: normalizedItems,
    completedCount,
    progressPercent: Math.round((completedCount / PROGRAMS.length) * 100),
    isComplete: completedCount === PROGRAMS.length,
  };
};

const persistSnapshot = async (snapshot) => {
  if (!process.env.DATABASE_URL) {
    return snapshot;
  }

  const sql = `
    INSERT INTO inscriptions_progress (
      progress_key,
      year,
      program_name,
      total_count,
      items,
      completed_count,
      progress_percent,
      updated_at
    )
    VALUES ($1, $2, $3, $4, $5::jsonb, $6, $7, CURRENT_TIMESTAMP)
    ON CONFLICT (progress_key)
    DO UPDATE SET
      year = EXCLUDED.year,
      program_name = EXCLUDED.program_name,
      total_count = EXCLUDED.total_count,
      items = EXCLUDED.items,
      completed_count = EXCLUDED.completed_count,
      progress_percent = EXCLUDED.progress_percent,
      updated_at = CURRENT_TIMESTAMP
    RETURNING *;
  `;

  const { rows } = await query(sql, [
    snapshot.progressKey,
    snapshot.year,
    snapshot.programName,
    snapshot.totalCount,
    JSON.stringify(snapshot.items),
    snapshot.completedCount,
    snapshot.progressPercent,
  ]);

  return rows[0];
};

let memoryProgress = buildSnapshot();

export const getInscriptionsProgress = async (_req, res, next) => {
  try {
    if (!process.env.DATABASE_URL) {
      return res.json({
        success: true,
        data: memoryProgress,
        isMock: true,
      });
    }

    const { rows } = await query(
      'SELECT * FROM inscriptions_progress WHERE progress_key = $1 LIMIT 1',
      [PROGRESS_KEY]
    );

    if (rows.length === 0) {
      const fallback = buildSnapshot();
      return res.json({
        success: true,
        data: fallback,
        isMock: false,
      });
    }

    const row = rows[0];
    const snapshot = buildSnapshot(row.items);

    return res.json({
      success: true,
      data: {
        ...snapshot,
        year: row.year || snapshot.year,
        programName: row.program_name || snapshot.programName,
        totalCount: row.total_count || snapshot.totalCount,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const updateInscriptionsProgress = async (req, res, next) => {
  try {
    const { items, itemId, done, reset } = req.body || {};

    let nextItems = null;

    if (reset === true) {
      nextItems = createDefaultItems();
    } else if (Array.isArray(items)) {
      nextItems = normalizeItems(items);
    } else if (itemId !== undefined) {
      const current = buildSnapshot(memoryProgress.items);
      const targetId = Number(itemId);

      if (!Number.isInteger(targetId) || targetId < 1 || targetId > PROGRAMS.length) {
        return res.status(400).json({
          success: false,
          message: `itemId must be between 1 and ${PROGRAMS.length}`,
        });
      }

      nextItems = current.items.map((item) => {
        if (item.id !== targetId) return item;
        const nextDone = done === undefined ? !item.done : Boolean(done);
        return { ...item, done: nextDone };
      });
    }

    if (!nextItems) {
      return res.status(400).json({
        success: false,
        message: 'Provide items, itemId, or reset: true',
      });
    }

    const snapshot = buildSnapshot(nextItems);
    memoryProgress = snapshot;

    const saved = await persistSnapshot(snapshot);

    return res.json({
      success: true,
      message: reset === true ? 'Inscriptions progress reset' : 'Inscriptions progress updated',
      data: saved || snapshot,
    });
  } catch (error) {
    next(error);
  }
};

export const resetInscriptionsProgress = async (_req, res, next) => {
  try {
    const snapshot = buildSnapshot();
    memoryProgress = snapshot;
    const saved = await persistSnapshot(snapshot);

    return res.json({
      success: true,
      message: 'Inscriptions progress reset',
      data: saved || snapshot,
    });
  } catch (error) {
    next(error);
  }
};
