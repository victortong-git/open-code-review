import dotenv from 'dotenv';
import { db } from '../models'; // Adjust path as necessary if models/index.ts is elsewhere
import { Sequelize } from 'sequelize';
import path from 'path';
import fs from 'fs';

// Load environment variables from .env file
dotenv.config();

// Set NODE_ENV to test, though it should ideally be set by the test script/environment
process.env.NODE_ENV = 'test';

// Function to run all migrations in order
async function runMigrations() {
  console.log('Jest GlobalSetup: Running migrations...');
  
  // Path to migrations directory
  const migrationsPath = path.join(__dirname, '../migrations');
  
  try {
    // Get all migration files, sort them to ensure they run in the correct order
    const migrationFiles = fs.readdirSync(migrationsPath)
      .filter(file => file.endsWith('.ts') || file.endsWith('.js'))
      .sort();
    
    // Required for importing TS files directly
    require('ts-node').register({
      transpileOnly: true,
      compilerOptions: {
        module: 'commonjs',
        target: 'es2017',
      },
    });
    
    // Drop all existing tables first
    await db.sequelize.getQueryInterface().dropAllTables();
    
    // Run each migration in sequence
    for (const file of migrationFiles) {
      console.log(`Jest GlobalSetup: Running migration: ${file}`);
      const migration = require(path.join(migrationsPath, file));
      
      // Run the up function of the migration
      if (migration && typeof migration.up === 'function') {
        await migration.up(db.sequelize.getQueryInterface(), Sequelize);
      } else {
        console.warn(`Jest GlobalSetup: Migration ${file} has no 'up' function, skipping.`);
      }
    }
    
    console.log('Jest GlobalSetup: All migrations completed successfully.');
    return true;
  } catch (error) {
    console.error('Jest GlobalSetup: Error running migrations:', error);
    throw error;
  }
}

export default async () => {
  console.log('\nJest GlobalSetup: Starting...');
  try {
    console.log('Jest GlobalSetup: Authenticating database connection...');
    await db.sequelize.authenticate();
    console.log('Jest GlobalSetup: Database connection established successfully.');
    
    // Run migrations instead of sync to match production setup
    await runMigrations();
    
    // Check schema to debug issues
    const schemaChecker = require('./check-schema').default;
    await schemaChecker();
    
    console.log('Jest GlobalSetup: Database initialized successfully.');
  } catch (error) {
    console.error('Jest GlobalSetup: Error during database setup:', error);
    process.exit(1); // Exit if global setup fails
  }
  console.log('Jest GlobalSetup: Finished.');
};