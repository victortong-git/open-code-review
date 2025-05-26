import dotenv from 'dotenv';

dotenv.config(); // Load environment variables from .env file

module.exports = {
  development: {
    username: process.env.DB_USER || 'admin',
    password: process.env.DB_PASSWORD || 'adminpass',
    database: 'opencodereview', // Hardcoded database name
    host: process.env.DB_HOST || 'db', // 'db' is the service name in docker-compose
    dialect: 'postgres',
    port: process.env.DB_PORT ? parseInt(process.env.DB_PORT, 10) : 5432,
  },
  test: {
    username: process.env.DB_USER || 'admin',
    password: process.env.DB_PASSWORD || 'adminpass',
    database: 'opencodereview_test', // Hardcoded database name for test
    host: 'db', // Hardcode for in-container testing
    dialect: 'postgres',
    port: 5432, // Hardcode for in-container testing
    logging: false,
  },
  production: {
    username: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: 'opencodereview', // Hardcoded database name for production
    host: process.env.DB_HOST,
    dialect: 'postgres',
    port: process.env.DB_PORT ? parseInt(process.env.DB_PORT, 10) : 5432,
    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: false // Adjust as per your SSL certificate setup
      }
    },
    logging: false,
  }
};