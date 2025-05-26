import { QueryInterface } from 'sequelize';

module.exports = {
  up: async (queryInterface: QueryInterface) => {
    // 1. Add code_content and md5 fields to findings table
    await queryInterface.addColumn('findings', 'code_content', {
      type: 'TEXT',
      allowNull: true,
    });

    await queryInterface.addColumn('findings', 'md5', {
      type: 'TEXT',
      allowNull: true,
    });

    // 2. Rename suggestion_security to recommendation
    await queryInterface.renameColumn('findings', 'suggestion_security', 'recommendation');

    // 3. Add md5 field to code_snippets table
    await queryInterface.addColumn('code_snippets', 'md5', {
      type: 'TEXT',
      allowNull: true,
    });

    // 4. Remove code_snippet_id from findings table (after adding replacement fields)
    // We need to ensure any data needed is migrated before removing the field
    await queryInterface.removeColumn('findings', 'code_snippet_id');
  },

  down: async (queryInterface: QueryInterface) => {
    // Revert all changes in reverse order
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
    
    await queryInterface.removeColumn('code_snippets', 'md5');
    await queryInterface.renameColumn('findings', 'recommendation', 'suggestion_security');
    await queryInterface.removeColumn('findings', 'md5');
    await queryInterface.removeColumn('findings', 'code_content');
  }
};
