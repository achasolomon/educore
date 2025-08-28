// backend/src/core/database/connection.js
const knex = require('knex');
const config = require('../../../knexfile');
const logger = require('../utils/logger');

const environment = process.env.NODE_ENV || 'development';
const db = knex(config[environment]);

// Test database connection
db.raw('SELECT 1')
  .then(() => {
    logger.info('Database connection established successfully');
  })
  .catch((error) => {
    logger.error('Database connection failed:', error);
    process.exit(1);
  });

module.exports = db;