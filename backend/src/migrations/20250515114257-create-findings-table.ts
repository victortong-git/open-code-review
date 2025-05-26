'use strict';
import { QueryInterface, DataTypes, Sequelize } from 'sequelize';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface: QueryInterface, sequelize: Sequelize) {
    await queryInterface.createTable('findings', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: DataTypes.INTEGER
      },
      review_request_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: 'review_requests', // Name of the referenced table
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      type: {
        type: DataTypes.STRING(100), // e.g., XSS, SQLi, Hardcoded Secret
        allowNull: false
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: false
      },
      severity: {
        type: DataTypes.STRING(50), // e.g., critical, high, medium, low
        allowNull: true
      },
      status: {
        type: DataTypes.STRING(50), // e.g., new, confirmed, resolved, wont_fix
        allowNull: true
      },
      line_number: {
        type: DataTypes.INTEGER,
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
    await queryInterface.dropTable('findings');
  }
};