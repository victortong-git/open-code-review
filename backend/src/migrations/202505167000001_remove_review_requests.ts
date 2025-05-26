import { QueryInterface, DataTypes } from 'sequelize';

// Export up and down functions directly
export async function up(queryInterface: QueryInterface): Promise<void> {
  try {
    // Remove the foreign key constraint from findings table
    await queryInterface.removeConstraint('findings', 'findings_review_request_id_fkey');
    
    // Remove the review_request_id column from findings
    await queryInterface.removeColumn('findings', 'review_request_id');

    // Drop the review_requests table
    await queryInterface.dropTable('review_requests');
    
    console.log('Migration completed successfully: review_requests table and related columns removed.');
  } catch (error) {
    console.error('Migration failed:', error);
    throw error;
  }
}

export async function down(queryInterface: QueryInterface): Promise<void> {
  try {
    // Recreate the review_requests table
    await queryInterface.createTable('review_requests', {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
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
        allowNull: true
      },
      createdAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW
      },
      updatedAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW
      }
    });

    // Add review_request_id column back to findings table
    await queryInterface.addColumn('findings', 'review_request_id', {
      type: DataTypes.INTEGER,
      allowNull: true, // Set to true to avoid issues if findings exist without it, adjust as needed
      references: {
        model: 'review_requests',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL' // Or 'CASCADE' depending on desired behavior
    });

    // Recreate the foreign key constraint
    await queryInterface.addConstraint('findings', {
      fields: ['review_request_id'],
      type: 'foreign key',
      name: 'findings_review_request_id_fkey', // Optional: specify a name for the constraint
      references: {
        table: 'review_requests',
        field: 'id'
      },
      onDelete: 'SET NULL', // Or 'CASCADE'
      onUpdate: 'CASCADE'
    });
    console.log('Rollback completed successfully: review_requests table and related columns restored.');
  } catch (error) {
    console.error('Rollback failed:', error);
    throw error;
  }
}
