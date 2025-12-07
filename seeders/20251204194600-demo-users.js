'use strict';

const bcrypt = require('bcryptjs');

module.exports = {
  async up (queryInterface, Sequelize) {
    const hashedPassword = await bcrypt.hash('password123', 12);

    await queryInterface.bulkInsert('Users', [
      {
        email: 'admin@vipme.com',
        password: hashedPassword,
        firstName: 'Admin',
        lastName: 'User',
        role: 'admin',
        emailVerified: true,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        email: 'seller1@vipme.com',
        password: hashedPassword,
        firstName: 'John',
        lastName: 'Seller',
        phoneNumber: '+1234567890',
        role: 'seller',
        emailVerified: true,
        isActive: true,
        onboardingCompleted: true,
        chargesEnabled: true,
        payoutsEnabled: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        email: 'seller2@vipme.com',
        password: hashedPassword,
        firstName: 'Sarah',
        lastName: 'Store',
        phoneNumber: '+1234567891',
        role: 'seller',
        emailVerified: true,
        isActive: true,
        onboardingCompleted: true,
        chargesEnabled: true,
        payoutsEnabled: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        email: 'user1@example.com',
        password: hashedPassword,
        firstName: 'Alice',
        lastName: 'Customer',
        phoneNumber: '+1234567892',
        role: 'user',
        emailVerified: true,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ]);
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.bulkDelete('Users', null, {});
  }
};