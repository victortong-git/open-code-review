'use strict';
import { QueryInterface, DataTypes, Sequelize } from 'sequelize';

module.exports = {
  up: async (queryInterface: QueryInterface, Sequelize: any) => {
    // Add new fields to files table
    await queryInterface.addColumn('files', 'md5', {
      type: DataTypes.TEXT,
      allowNull: true
    });

    await queryInterface.addColumn('files', 'isChanged', {
      type: DataTypes.BOOLEAN,
      allowNull: true,
      defaultValue: false
    });

    await queryInterface.addColumn('files', 'isProcessed', {
      type: DataTypes.BOOLEAN,
      allowNull: true,
      defaultValue: false
    });

    await queryInterface.addColumn('files', 'description', {
      type: DataTypes.TEXT,
      allowNull: true
    });

    await queryInterface.addColumn('files', 'initial_security_review', {
      type: DataTypes.TEXT,
      allowNull: true
    });

    await queryInterface.addColumn('files', 'initial_coding_quality', {
      type: DataTypes.TEXT,
      allowNull: true
    });

    await queryInterface.addColumn('files', 'line_of_code', {
      type: DataTypes.INTEGER,
      allowNull: true
    });

    await queryInterface.addColumn('files', 'file_type', {
      type: DataTypes.TEXT,
      allowNull: true
    });
    
    // Create code_snippets table
    await queryInterface.createTable('code_snippets', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: DataTypes.BIGINT
      },
      file_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: 'files',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      code: {
        type: DataTypes.TEXT,
        allowNull: false
      },
      code_type: {
        type: DataTypes.TEXT,
        allowNull: true
      },
      start_line: {
        type: DataTypes.INTEGER,
        allowNull: true
      },
      end_line: {
        type: DataTypes.INTEGER,
        allowNull: true
      },
      line_of_code: {
        type: DataTypes.INTEGER,
        allowNull: true
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: true
      },
      initial_security_review: {
        type: DataTypes.TEXT,
        allowNull: true
      },
      initial_coding_quality: {
        type: DataTypes.TEXT,
        allowNull: true
      },
      isAssessed: {
        type: DataTypes.BOOLEAN,
        allowNull: true,
        defaultValue: false
      },
      assessedAt: {
        type: DataTypes.DATE,
        allowNull: true
      },
      code_quality: {
        type: DataTypes.STRING(50),
        allowNull: true
      },
      code_quality_reason: {
        type: DataTypes.TEXT,
        allowNull: true
      },
      code_snippet_example: {
        type: DataTypes.TEXT,
        allowNull: true
      },
      createdAt: {
        allowNull: false,
        type: DataTypes.DATE,
        defaultValue: Sequelize.fn('NOW')
      },
      updatedAt: {
        allowNull: false,
        type: DataTypes.DATE,
        defaultValue: Sequelize.fn('NOW')
      }
    });
  },

  down: async (queryInterface: QueryInterface) => {
    // Drop the code_snippets table
    await queryInterface.dropTable('code_snippets');
    
    // Remove new columns from files table
    await queryInterface.removeColumn('files', 'md5');
    await queryInterface.removeColumn('files', 'isChanged');
    await queryInterface.removeColumn('files', 'isProcessed');
    await queryInterface.removeColumn('files', 'description');
    await queryInterface.removeColumn('files', 'initial_security_review');
    await queryInterface.removeColumn('files', 'initial_coding_quality');
    await queryInterface.removeColumn('files', 'line_of_code');
    await queryInterface.removeColumn('files', 'file_type');
  }
};
