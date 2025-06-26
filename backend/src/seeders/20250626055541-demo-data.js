'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    const projects = await queryInterface.bulkInsert('projects', [{
      name: 'Test Project',
      description: 'A project for testing purposes',
      createdAt: new Date(),
      updatedAt: new Date()
    }], {}, { returning: true }); // Add returning: true to get the inserted records

    if (projects && projects.length > 0) {
      const projectId = projects[0].id; // Get the ID from the first inserted project

      await queryInterface.bulkInsert('files', [{
        project_id: projectId,
        file_path: '/test/file.js',
        file_name: 'file.js',
        content: 'console.log("Hello World!");',
        isScanned: false,
        isIgnored: false,
        md5: '5d41402abc4b2a76b9719d911017c592', // MD5 for "Hello World!"
        isChanged: false,
        isProcessed: false,
        createdAt: new Date(),
        updatedAt: new Date()
      }], {});
    }
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.bulkDelete('files', null, {});
    await queryInterface.bulkDelete('projects', null, {});
  }
};