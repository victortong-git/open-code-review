import { db } from '../models';

export default async () => {
  try {
    // Log database schema
    const queryInterface = db.sequelize.getQueryInterface();
    const tables = await queryInterface.showAllTables();
    console.log('Tables in database:', tables);
    
    // Get schema for Files table
    if (tables.includes('files')) {
      const tableDescription = await queryInterface.describeTable('files');
      console.log('Files table schema:', JSON.stringify(tableDescription, null, 2));
    }

    return 0;
  } catch (error) {
    console.error('Error checking database schema:', error);
    return 1;
  }
};
