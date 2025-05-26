'use strict';
import { QueryInterface, DataTypes, Sequelize } from 'sequelize';

module.exports = {
  up: async (queryInterface: QueryInterface, Sequelize: any) => {
    // Add new fields to findings table
    await queryInterface.addColumn('findings', 'severity_reason', {
      type: DataTypes.TEXT,
      allowNull: true
    });

    await queryInterface.addColumn('findings', 'code_snippet_id', {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'code_snippets',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL'
    });

    await queryInterface.addColumn('findings', 'suggestion_security', {
      type: DataTypes.TEXT,
      allowNull: true
    });
  },

  down: async (queryInterface: QueryInterface) => {
    // Remove new columns from findings table
    await queryInterface.removeColumn('findings', 'severity_reason');
    await queryInterface.removeColumn('findings', 'code_snippet_id');
    await queryInterface.removeColumn('findings', 'suggestion_security');
  }
};
