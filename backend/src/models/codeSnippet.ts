import { Model, DataTypes, Sequelize, Optional, ForeignKey } from 'sequelize';
// Remove direct import to avoid circular dependency
// import { File } from './file';

// Interface for CodeSnippet attributes
interface CodeSnippetAttributes {
  id: number;
  file_id: ForeignKey<number>; // Just use number instead of File['id']
  code: string;
  code_type?: string;
  start_line?: number;
  end_line?: number;
  line_of_code?: number;
  description?: string;
  initial_security_review?: string;
  initial_coding_quality?: string;
  isAssessed?: boolean;
  assessedAt?: Date;
  code_quality?: string;
  code_quality_reason?: string;
  code_snippet_example?: string;
  md5?: string; // MD5 hash of the source file
  // Timestamps
  createdAt?: Date;
  updatedAt?: Date;
}

// Interface for CodeSnippet creation attributes
interface CodeSnippetCreationAttributes extends Optional<CodeSnippetAttributes, 'id' | 'code_type' | 'start_line' | 'end_line' | 'line_of_code' | 'description' | 'initial_security_review' | 'initial_coding_quality' | 'isAssessed' | 'assessedAt' | 'code_quality' | 'code_quality_reason' | 'code_snippet_example' | 'md5' | 'createdAt' | 'updatedAt'> {}

export class CodeSnippet extends Model<CodeSnippetAttributes, CodeSnippetCreationAttributes> implements CodeSnippetAttributes {
  public id!: number;
  public file_id!: ForeignKey<number>; // Update type here too
  public code!: string;
  public code_type?: string;
  public start_line?: number;
  public end_line?: number;
  public line_of_code?: number;
  public description?: string;
  public initial_security_review?: string;
  public initial_coding_quality?: string;
  public isAssessed?: boolean;
  public assessedAt?: Date;
  public code_quality?: string;
  public code_quality_reason?: string;
  public code_snippet_example?: string;
  public md5?: string; // MD5 hash of the source file

  // Timestamps
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  // Associations can be defined here
  public static associate(models: {
    File: any; // Use 'any' to avoid circular dependency
  }) {
    CodeSnippet.belongsTo(models.File, {
      foreignKey: 'file_id',
      as: 'file',
    });
    // Remove association with Finding as per new data relationship
  }
}

export default (sequelize: Sequelize): typeof CodeSnippet => {
  CodeSnippet.init(
    {
      id: {
        type: DataTypes.BIGINT,
        autoIncrement: true,
        primaryKey: true,
      },
      file_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: 'files',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      code: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      code_type: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      start_line: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      end_line: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      line_of_code: {
        type: DataTypes.INTEGER,
        allowNull: true,
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
      isAssessed: {
        type: DataTypes.BOOLEAN,
        allowNull: true,
        defaultValue: false,
      },
      assessedAt: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      code_quality: {
        type: DataTypes.STRING(50),
        allowNull: true,
      },
      code_quality_reason: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      code_snippet_example: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      md5: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
    },
    {
      tableName: 'code_snippets',
      sequelize,
    }
  );

  return CodeSnippet;
};
