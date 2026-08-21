import app from './app.js';
import { config } from './config/env.js';
import { initDb } from './config/db.js';

const startServer = async () => {
  // Initialize Database connection & tables
  await initDb();

  const server = app.listen(config.port, () => {
    console.log(`🚀 Server running in ${config.nodeEnv} mode on port ${config.port}`);
    console.log(`📍 Health Endpoint: http://localhost:${config.port}/api/v1/health`);
    console.log(`📍 Notes API:       http://localhost:${config.port}/api/v1/notes`);
    console.log(`📍 Email & n8n API: http://localhost:${config.port}/api/v1/emails/send`);
    console.log(`📍 Driving Lessons: http://localhost:${config.port}/api/v1/driving-lessons`);
    console.log(`📍 Inscriptions:    http://localhost:${config.port}/api/v1/inscriptions`);
  });

  const gracefulShutdown = (signal) => {
    console.log(`\nReceived ${signal}. Shutting down gracefully...`);
    server.close(() => {
      console.log('HTTP server closed.');
      process.exit(0);
    });
  };

  process.on('SIGINT', () => gracefulShutdown('SIGINT'));
  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
};

startServer();
