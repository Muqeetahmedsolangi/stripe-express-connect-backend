'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.createTable('Users', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      email: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true
      },
      password: {
        type: Sequelize.STRING,
        allowNull: false
      },
      firstName: {
        type: Sequelize.STRING(50),
        allowNull: false
      },
      lastName: {
        type: Sequelize.STRING(50),
        allowNull: false
      },
      phoneNumber: {
        type: Sequelize.STRING,
        allowNull: true
      },
      stripeCustomerId: {
        type: Sequelize.STRING,
        allowNull: true
      },
      stripeAccountId: {
        type: Sequelize.STRING,
        allowNull: true
      },
      onboardingCompleted: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      chargesEnabled: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      payoutsEnabled: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      role: {
        type: Sequelize.ENUM('user', 'seller', 'admin'),
        defaultValue: 'user'
      },
      isActive: {
        type: Sequelize.BOOLEAN,
        defaultValue: true
      },
      emailVerified: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      lastLogin: {
        type: Sequelize.DATE,
        allowNull: true
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE
      }
    });

    await queryInterface.addIndex('Users', ['email']);
    await queryInterface.addIndex('Users', ['stripeCustomerId']);
    await queryInterface.addIndex('Users', ['stripeAccountId']);
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.dropTable('Users');
  }
};