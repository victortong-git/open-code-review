import { QueryInterface } from 'sequelize';

module.exports = {
  up: async (queryInterface: QueryInterface) => {
    // Remove code_snippet_id from findings table
    await queryInterface.removeColumn('findings', 'code_snippet_id');
  },

  down: async (queryInterface: QueryInterface) => {
    // Add back code_snippet_id
    await queryInterface.addColumn('findings', 'code_snippet_id', {
      type: 'INTEGER',
      allowNull: true,
      references: {
        model: 'code_snippets',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL'
    });
  }
};
