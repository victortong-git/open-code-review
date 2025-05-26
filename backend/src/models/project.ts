import { Model, DataTypes, Sequelize, Optional } from 'sequelize';

// Interface for Project attributes
interface ProjectAttributes {
  id: number;
  name: string;
  description?: string;
  // Timestamps
  createdAt?: Date;
  updatedAt?: Date;
}

// Interface for Project creation attributes (id is optional)
interface ProjectCreationAttributes extends Optional<ProjectAttributes, 'id' | 'description' | 'createdAt' | 'updatedAt'> {}

export class Project extends Model<ProjectAttributes, ProjectCreationAttributes> implements ProjectAttributes {
  public id!: number;
  public name!: string;
  public description?: string;

  // Timestamps
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  // Associations can be defined here
  public static associate(models: { File: typeof import('./file').File }) {
    Project.hasMany(models.File, {
      foreignKey: 'project_id', // Ensure this matches the foreign key in File model
      as: 'files',
    });
  }
}

export default (sequelize: Sequelize): typeof Project => {
  Project.init(
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      name: {
        type: new DataTypes.STRING(255),
        allowNull: false,
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
    },
    {
      tableName: 'projects',
      sequelize, // passing the `sequelize` instance is required
    }
  );

  return Project;
};