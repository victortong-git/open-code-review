// Set environment to test before importing any models
import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

// Set NODE_ENV to test
process.env.NODE_ENV = 'test';

// Import db after env is set
import { db } from '../models';

// This file is run via setupFilesAfterEnv for each test file.
// Global setup (sync) and teardown (close) are handled by globalSetup and globalTeardown scripts.
// We only need to ensure the connection is authenticated here if needed by tests directly,
// or simply rely on globalSetup having established it.
// For simplicity, we can keep the authenticate call to ensure each test file
// starts with a verified connection, though it might be redundant if globalSetup succeeds.

beforeAll(async () => {
  try {
    if (db && db.sequelize) {
      // console.log('Test-Setup (beforeAll): Authenticating database connection for test file...');
      await db.sequelize.authenticate();
      // console.log('Test-Setup (beforeAll): Database connection authenticated for test file.');
    } else {
      console.error('Test-Setup (beforeAll): Sequelize instance not found in db object.');
      // This might indicate an issue with how db is initialized or imported
    }
  } catch (error) {
    console.error('Test-Setup (beforeAll): Error authenticating database:', error);
    // throw error; // Re-throwing might stop all tests if one file fails here.
  }
});

// No afterAll here, globalTeardown handles closing the connection.