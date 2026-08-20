import pg from 'pg';
import { config } from './env.js';

const { Pool } = pg;

const connectionString = process.env.DATABASE_URL;

export const pool = new Pool({
  connectionString: connectionString || 'postgres://postgres:postgres@localhost:5432/errifidb',
  ssl: connectionString ? { rejectUnauthorized: false } : false,
});

export const query = (text, params) => pool.query(text, params);

export const initDb = async () => {
  if (!connectionString) {
    console.warn('⚠️  DATABASE_URL is not set in .env. Skipping database table initialization.');
    return;
  }

  const createNotesTable = `
    CREATE TABLE IF NOT EXISTS notes (
      id SERIAL PRIMARY KEY,
      title VARCHAR(255) NOT NULL,
      body TEXT NOT NULL,
      category VARCHAR(50) DEFAULT 'Work',
      pinned BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `;

  const createTasksTable = `
    CREATE TABLE IF NOT EXISTS tasks (
      id SERIAL PRIMARY KEY,
      title VARCHAR(255) NOT NULL,
      priority VARCHAR(20) DEFAULT 'Normal',
      done BOOLEAN DEFAULT FALSE,
      due VARCHAR(50) DEFAULT 'Today',
      tag VARCHAR(50) DEFAULT 'Work',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `;

  const createEmailsTable = `
    CREATE TABLE IF NOT EXISTS emails (
      id SERIAL PRIMARY KEY,
      recipient VARCHAR(255) NOT NULL,
      subject VARCHAR(255) NOT NULL,
      body_html TEXT NOT NULL,
      priority VARCHAR(20) DEFAULT 'Normal',
      status VARCHAR(50) DEFAULT 'PENDING',
      n8n_response TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `;

  const createDrivingLessonsTable = `
    CREATE TABLE IF NOT EXISTS driving_lesson_progress (
      id SERIAL PRIMARY KEY,
      progress_key VARCHAR(50) UNIQUE NOT NULL DEFAULT 'default',
      total_lessons INT NOT NULL DEFAULT 20,
      lessons JSONB NOT NULL DEFAULT '[]'::jsonb,
      completed_count INT NOT NULL DEFAULT 0,
      progress_percent INT NOT NULL DEFAULT 0,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `;

  try {
    const client = await pool.connect();
    console.log('🐘 Connected to PostgreSQL Neon Cloud Database successfully!');
    await client.query(createNotesTable);
    await client.query(createTasksTable);
    await client.query(createEmailsTable);
    await client.query(createDrivingLessonsTable);
    console.log('✅ PostgreSQL database tables (notes, tasks, emails, driving_lesson_progress) verified/created.');
    client.release();
  } catch (err) {
    console.error('❌ PostgreSQL connection/initialization error:', err.message);
    console.info('💡 Note: You can provide a valid external DATABASE_URL in .env to enable live PostgreSQL queries.');
  }
};
