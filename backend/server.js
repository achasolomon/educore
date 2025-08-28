require('dotenv').config();

try {
  const app = require('./src/app');
  const logger = require('./src/core/utils/logger');

  const PORT = process.env.PORT || 5000;
  const NODE_ENV = process.env.NODE_ENV || 'development';

  // Start server
  const server = app.listen(PORT, () => {
    logger.info(`🚀 EduCore Server running on port ${PORT} in ${NODE_ENV} mode`);
    logger.info(`📖 API Documentation: http://localhost:${PORT}/api/docs`);
  });

  // Error handling for server
  server.on('error', (error) => {
    logger.error('Server error:', error);
    if (error.code === 'EADDRINUSE') {
      logger.error(`Port ${PORT} is already in use`);
    }
  });

  // Graceful shutdown
  process.on('SIGTERM', () => {
    logger.info('SIGTERM received, shutting down gracefully...');
    server.close(() => {
      logger.info('Process terminated');
      process.exit(0);
    });
  });

  process.on('uncaughtException', (error) => {
    logger.error('Uncaught Exception:', error);
    process.exit(1);
  });

  process.on('unhandledRejection', (reason, promise) => {
    logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
    process.exit(1);
  });

} catch (error) {
  console.error('Application failed to start:', error);
  process.exit(1);
}