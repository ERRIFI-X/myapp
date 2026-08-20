import { query } from '../config/db.js';

const TOTAL_LESSONS = 20;
const PROGRESS_KEY = 'default';

const createDefaultLessons = () =>
  Array.from({ length: TOTAL_LESSONS }, (_, index) => ({
    id: index + 1,
    done: false,
  }));

const normalizeLessons = (lessons = []) => {
  const source = Array.isArray(lessons) ? lessons : [];

  return createDefaultLessons().map((lesson) => {
    const match = source.find((item) => Number(item?.id) === lesson.id);
    return {
      id: lesson.id,
      done: Boolean(match?.done),
    };
  });
};

const buildSnapshot = (lessons = []) => {
  const normalizedLessons = normalizeLessons(lessons);
  const completedCount = normalizedLessons.filter((lesson) => lesson.done).length;

  return {
    totalLessons: TOTAL_LESSONS,
    lessons: normalizedLessons,
    completedCount,
    progressPercent: Math.round((completedCount / TOTAL_LESSONS) * 100),
    isComplete: completedCount === TOTAL_LESSONS,
  };
};

const persistProgress = async (snapshot) => {
  if (!process.env.DATABASE_URL) {
    return snapshot;
  }

  const sql = `
    INSERT INTO driving_lesson_progress (
      progress_key,
      total_lessons,
      lessons,
      completed_count,
      progress_percent,
      updated_at
    )
    VALUES ($1, $2, $3::jsonb, $4, $5, CURRENT_TIMESTAMP)
    ON CONFLICT (progress_key)
    DO UPDATE SET
      total_lessons = EXCLUDED.total_lessons,
      lessons = EXCLUDED.lessons,
      completed_count = EXCLUDED.completed_count,
      progress_percent = EXCLUDED.progress_percent,
      updated_at = CURRENT_TIMESTAMP
    RETURNING *;
  `;

  const { rows } = await query(sql, [
    PROGRESS_KEY,
    snapshot.totalLessons,
    JSON.stringify(snapshot.lessons),
    snapshot.completedCount,
    snapshot.progressPercent,
  ]);

  return rows[0];
};

let memoryProgress = buildSnapshot();

export const getDrivingLessonsProgress = async (_req, res, next) => {
  try {
    if (!process.env.DATABASE_URL) {
      return res.json({
        success: true,
        data: memoryProgress,
        isMock: true,
      });
    }

    const { rows } = await query(
      'SELECT * FROM driving_lesson_progress WHERE progress_key = $1 LIMIT 1',
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
    const snapshot = buildSnapshot(row.lessons);

    return res.json({
      success: true,
      data: {
        ...snapshot,
        totalLessons: row.total_lessons || snapshot.totalLessons,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const updateDrivingLessonsProgress = async (req, res, next) => {
  try {
    const { lessons, lessonId, done, reset } = req.body || {};

    let nextLessons = null;

    if (reset === true) {
      nextLessons = createDefaultLessons();
    } else if (Array.isArray(lessons)) {
      nextLessons = normalizeLessons(lessons);
    } else if (lessonId !== undefined) {
      const current = buildSnapshot(memoryProgress.lessons);
      const targetId = Number(lessonId);

      if (!Number.isInteger(targetId) || targetId < 1 || targetId > TOTAL_LESSONS) {
        return res.status(400).json({
          success: false,
          message: `lessonId must be between 1 and ${TOTAL_LESSONS}`,
        });
      }

      nextLessons = current.lessons.map((lesson) => {
        if (lesson.id !== targetId) return lesson;
        const nextDone = done === undefined ? !lesson.done : Boolean(done);
        return { ...lesson, done: nextDone };
      });
    }

    if (!nextLessons) {
      return res.status(400).json({
        success: false,
        message: 'Provide lessons, lessonId, or reset: true',
      });
    }

    const snapshot = buildSnapshot(nextLessons);
    memoryProgress = snapshot;

    const saved = await persistProgress(snapshot);

    return res.json({
      success: true,
      message: reset === true ? 'Driving lessons progress reset' : 'Driving lessons progress updated',
      data: saved || snapshot,
    });
  } catch (error) {
    next(error);
  }
};

export const resetDrivingLessonsProgress = async (_req, res, next) => {
  try {
    const snapshot = buildSnapshot();
    memoryProgress = snapshot;
    const saved = await persistProgress(snapshot);

    return res.json({
      success: true,
      message: 'Driving lessons progress reset',
      data: saved || snapshot,
    });
  } catch (error) {
    next(error);
  }
};
