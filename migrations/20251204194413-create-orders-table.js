'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.createTable('Orders', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      orderNumber: {
        type: Sequelize.STRING,
        unique: true,
        allowNull: false
      },
      userId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'Users',
          key: 'id'
        }
      },
      subtotal: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false
      },
      governmentTax: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false
      },
      platformFee: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false
      },
      total: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false
      },
      governmentTaxRate: {
        type: Sequelize.DECIMAL(5, 4),
        defaultValue: 0.0725
      },
      platformFeeRate: {
        type: Sequelize.DECIMAL(5, 4),
        defaultValue: 0.0325
      },
      stripePaymentIntentId: {
        type: Sequelize.STRING,
        allowNull: true
      },
      paymentStatus: {
        type: Sequelize.ENUM('pending', 'succeeded', 'failed', 'canceled'),
        defaultValue: 'pending'
      },
      paymentMethod: {
        type: Sequelize.STRING,
        allowNull: true
      },
      currency: {
        type: Sequelize.STRING(3),
        defaultValue: 'USD'
      },
      paidAt: {
        type: Sequelize.DATE,
        allowNull: true
      },
      status: {
        type: Sequelize.ENUM('pending', 'confirmed', 'canceled'),
        defaultValue: 'pending'
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

    await queryInterface.addIndex('Orders', ['userId']);
    await queryInterface.addIndex('Orders', ['orderNumber']);
    await queryInterface.addIndex('Orders', ['stripePaymentIntentId']);
    await queryInterface.addIndex('Orders', ['status']);
    await queryInterface.addIndex('Orders', ['createdAt']);
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.dropTable('Orders');
  }
};
