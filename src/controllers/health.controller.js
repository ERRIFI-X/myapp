export const getHealthStatus = (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Server is healthy and running smoothly',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
};
