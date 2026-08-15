import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import routes from './routes/index.js';
import { notFoundHandler } from './middlewares/notFound.middleware.js';
import { errorHandler } from './middlewares/error.middleware.js';

const app = express();

// Security and Logging Middlewares
app.use(helmet());
app.use(cors());
app.use(morgan('dev'));

// Core Body Parsers
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Root Welcome Endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'Welcome to the Express.js API',
    status: 'online',
    documentation: '/api/v1/health',
  });
});

// API Router Setup (Supports both /api and /api/v1 for frontend compatibility)
app.use('/api/v1', routes);
app.use('/api', routes);

// 404 & Global Error Handling
app.use(notFoundHandler);
app.use(errorHandler);

export default app;
