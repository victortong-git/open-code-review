import { Model, DataTypes, Sequelize, Optional, ForeignKey } from 'sequelize';
import { Project } from './project'; // Correctly import the named export
import { CodeSnippet } from './codeSnippet.js'; // Import CodeSnippet model

// Interface for File attributes
interface FileAttributes {
  id: number;
  project_id: ForeignKey<Project['id']>;
  file_path: string;
  file_name: string;
  content?: string; // Or reference to storage
  isScanned?: boolean;
  isIgnored?: boolean;
  md5?: string;
  isChanged?: boolean;
  isProcessed?: boolean;
  description?: string;
  initial_security_review?: string;
  initial_coding_quality?: string;
  line_of_code?: number;
  file_type?: string;
  // Timestamps
  createdAt?: Date;
  updatedAt?: Date;
}

// Interface for File creation attributes
interface FileCreationAttributes extends Optional<FileAttributes, 'id' | 'content' | 'isScanned' | 'isIgnored' | 'md5' | 'isChanged' | 'isProcessed' | 'description' | 'initial_security_review' | 'initial_coding_quality' | 'line_of_code' | 'file_type' | 'createdAt' | 'updatedAt'> {}

export class File extends Model<FileAttributes, FileCreationAttributes> implements FileAttributes {
  public id!: number;
  public project_id!: ForeignKey<Project['id']>;
  public file_path!: string;
  public file_name!: string;
  public content?: string;
  public isScanned?: boolean;
  public isIgnored?: boolean;
  public md5?: string;
  public isChanged?: boolean;
  public isProcessed?: boolean;
  public description?: string;
  public initial_security_review?: string;
  public initial_coding_quality?: string;
  public line_of_code?: number;
  public file_type?: string;

  // Timestamps
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  // Associations can be defined here
  public static associate(models: {
    Project: typeof import('./project').Project;
    CodeSnippet: any; // Use 'any' to avoid circular dependency issues
    Finding: any; // Use 'any' to avoid circular dependency issues
  }) {
    File.belongsTo(models.Project, {
      foreignKey: 'project_id', // This must match the column name in the File table
      as: 'project',
    });
    // ReviewRequest association removed as the table no longer exists
    File.hasMany(models.CodeSnippet, {
      foreignKey: 'file_id',
      as: 'codeSnippets',
    });
    // Add association to Findings based on md5 hash
    File.hasMany(models.Finding, {
      sourceKey: 'md5',
      foreignKey: 'md5',
      as: 'findings',
    });
  }
}

export default (sequelize: Sequelize): typeof File => {
  File.init(
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      project_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: 'projects', // Name of the table
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      file_path: {
        type: new DataTypes.STRING(255),
        allowNull: false,
      },
      file_name: {
        type: new DataTypes.STRING(255),
        allowNull: false,
      },
      content: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      isScanned: {
        type: DataTypes.BOOLEAN,
        allowNull: true,
        defaultValue: false,
      },
      isIgnored: {
        type: DataTypes.BOOLEAN,
        allowNull: true,
        defaultValue: false,
      },
      md5: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      isChanged: {
        type: DataTypes.BOOLEAN,
        allowNull: true,
        defaultValue: false,
      },
      isProcessed: {
        type: DataTypes.BOOLEAN,
        allowNull: true,
        defaultValue: false,
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      initial_security_review: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      initial_coding_quality: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      line_of_code: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      file_type: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
    },
    {
      tableName: 'files',
      sequelize,
    }
  );

  return File;
};
