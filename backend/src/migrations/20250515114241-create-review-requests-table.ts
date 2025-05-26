'use strict';
import { QueryInterface, DataTypes, Sequelize } from 'sequelize';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface: QueryInterface, sequelize: Sequelize) {
    await queryInterface.createTable('review_requests', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: DataTypes.INTEGER
      },
      file_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: 'files', // Name of the referenced table
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      title: {
        type: DataTypes.STRING(255),
        allowNull: false
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: true
      },
      status: {
        type: DataTypes.STRING(50),
        allowNull: true // Or add a defaultValue e.g., 'open'
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
    await queryInterface.dropTable('review_requests');
  }
};