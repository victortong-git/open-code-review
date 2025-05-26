import { db } from '../models'; // Adjust path as necessary

export default async () => {
  console.log('\nJest GlobalTeardown: Starting...');
  try {
    if (db && db.sequelize) {
      console.log('Jest GlobalTeardown: Closing database connection...');
      await db.sequelize.close();
      console.log('Jest GlobalTeardown: Database connection closed successfully.');
    } else {
      console.log('Jest GlobalTeardown: Sequelize instance not found, skipping close.');
    }
  } catch (error) {
    console.error('Jest GlobalTeardown: Error during database teardown:', error);
    process.exit(1); // Exit if global teardown fails
  }
  console.log('Jest GlobalTeardown: Finished.');
};