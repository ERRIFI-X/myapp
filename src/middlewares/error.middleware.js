import { config } from '../config/env.js';

export const errorHandler = (err, req, res, _next) => {
  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;

  res.status(statusCode).json({
    success: false,
    message: err.message || 'Internal Server Error',
    ...(config.isDev && { stack: err.stack }),
  });
};
