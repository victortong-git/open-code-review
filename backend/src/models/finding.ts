
import { Model, DataTypes, Sequelize, Optional, ForeignKey } from 'sequelize';
// import { ReviewRequest } from './reviewRequest'; // Removed as no longer needed
// Remove direct import to avoid circular dependency
// import { CodeSnippet } from './codeSnippet';

// Interface for Finding attributes
interface FindingAttributes {
  id: number;
  file_id?: number; // Added file_id
  type: string; // e.g., XSS, SQLi, Hardcoded Secret
  description: string;
  severity?: string; // e.g., critical, high, medium, low
  severity_reason?: string; // reason for the severity level
  status?: string; // e.g., new, confirmed, resolved, wont_fix
  line_number?: number;
  recommendation?: string; // renamed from suggestion_security
  code_content?: string; // extracted code content from the file
  md5?: string; // MD5 hash of the source file
  // Timestamps
  createdAt?: Date;
  updatedAt?: Date;
}

// Interface for Finding creation attributes
interface FindingCreationAttributes extends Optional<FindingAttributes, 'id' | 'severity' | 'severity_reason' | 'status' | 'line_number' | 'recommendation' | 'code_content' | 'md5' | 'createdAt' | 'updatedAt'> {}

export class Finding extends Model<FindingAttributes, FindingCreationAttributes> implements FindingAttributes {
  public id!: number;
  public file_id?: number; // Added file_id
  public type!: string;
  public description!: string;
  public severity?: string;
  public severity_reason?: string;
  public status?: string;
  public line_number?: number;
  public recommendation?: string; // Renamed from suggestion_security
  public code_content?: string; // New field for extracted code content
  public md5?: string; // New field for MD5 hash of source file

  // Timestamps
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  // Associations can be defined here
  public static associate(models: {
    // ReviewRequest removed as no longer needed
    File: any; // Use 'any' to avoid circular dependency
  }) {
    // Removed association with CodeSnippet as per new data relationship
    // Instead, we'll link findings directly to files via file_id
    Finding.belongsTo(models.File, {
      foreignKey: 'file_id', // Changed foreign key to file_id
      as: 'file',
    });
  }
}

export default (sequelize: Sequelize): typeof Finding => {
  Finding.init(
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      type: {
        type: new DataTypes.STRING(100),
        allowNull: false,
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      severity: {
        type: new DataTypes.STRING(50),
        allowNull: true,
      },
      severity_reason: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      status: {
        type: new DataTypes.STRING(50),
        allowNull: true,
      },
      file_id: { // Added file_id attribute definition
        type: DataTypes.INTEGER,
        allowNull: true, // Assuming file_id can be null if a finding is not associated with a file
        references: {
          model: 'files', // name of the target table
          key: 'id', // key in the target table that we're referencing
        }
      },
      line_number: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      recommendation: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      code_content: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      md5: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
    },
    {
      tableName: 'findings',
      sequelize,
    }
  );

  return Finding;
};