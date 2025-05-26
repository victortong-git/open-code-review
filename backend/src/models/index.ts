import { Sequelize, DataTypes } from 'sequelize';
import dbConfig = require('../config/database');

const env = process.env.NODE_ENV || 'development';
const config = (dbConfig as { [key: string]: any })[env];

let sequelize: Sequelize;
if (env === 'test') {
  // Use actual opencodereview_test database for testing instead of in-memory SQLite
  sequelize = new Sequelize(
    'opencodereview_test',
    config.username || 'postgres',
    config.password || 'postgres',
    {
      host: config.host || 'localhost',
      dialect: 'postgres',
      port: config.port || 5432,
      logging: false, // Disable logging in test environment
    }
  );
} else if (config.use_env_variable) {
  sequelize = new Sequelize(process.env[config.use_env_variable] as string);
} else {
  sequelize = new Sequelize(config.database, config.username, config.password, {
    host: config.host,
    dialect: config.dialect,
    port: config.port,
  });
}

// Rest of the file remains the same
import initializeProjectModel, { Project } from './project';
import initializeFileModel, { File } from './file';
// ReviewRequest model has been removed
import initializeFindingModel, { Finding } from './finding';
import initializeCodeSnippetModel, { CodeSnippet } from './codeSnippet';

const db: any = {};
db.sequelize = sequelize;
db.Sequelize = Sequelize;
db.Project = initializeProjectModel(sequelize);
db.File = initializeFileModel(sequelize);
// ReviewRequest has been removed
db.Finding = initializeFindingModel(sequelize);
db.CodeSnippet = initializeCodeSnippetModel(sequelize);

// Set up associations after all models are attached to db
if (db.Project.associate) db.Project.associate(db);
if (db.File.associate) db.File.associate(db);
// ReviewRequest association has been removed
if (db.Finding.associate) db.Finding.associate(db);
if (db.CodeSnippet.associate) db.CodeSnippet.associate(db);

export { sequelize, db };