'use strict';
import { QueryInterface, DataTypes, Sequelize } from 'sequelize';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface: QueryInterface, sequelize: Sequelize) {
    await queryInterface.createTable('files', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: DataTypes.INTEGER
      },
      project_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: 'projects', // Name of the referenced table
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      file_path: {
        type: DataTypes.STRING(255),
        allowNull: false
      },
      file_name: {
        type: DataTypes.STRING(255),
        allowNull: false
      },
      content: {
        type: DataTypes.TEXT,
        allowNull: true
      },
      createdAt: {
        allowNull: false,
        type: DataTypes.DATE,
        defaultValue: sequelize.literal('CURRENT_TIMESTAMP')
      },
      updatedAt: {
        allowNull: false,
        type: DataTypes.DATE,
        defaultValue: sequelize.literal('CURRENT_TIMESTAMP')
      }
    });
  },

  async down(queryInterface: QueryInterface, sequelize: Sequelize) {
    await queryInterface.dropTable('files');
  }
};