import { QueryInterface, DataTypes } from 'sequelize';

module.exports = {
  up: async (queryInterface: QueryInterface, Sequelize: typeof DataTypes) => {
    await queryInterface.addColumn('files', 'isScanned', {
      type: DataTypes.BOOLEAN,
      allowNull: true,
      defaultValue: false
    });

    await queryInterface.addColumn('files', 'isIgnored', {
      type: DataTypes.BOOLEAN,
      allowNull: true,
      defaultValue: false
    });
  },

  down: async (queryInterface: QueryInterface) => {
    await queryInterface.removeColumn('files', 'isScanned');
    await queryInterface.removeColumn('files', 'isIgnored');
  }
};
