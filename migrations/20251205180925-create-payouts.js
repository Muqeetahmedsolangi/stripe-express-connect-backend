'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.createTable('Payouts', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      sellerId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'Users',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      orderId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'Orders',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      stripeTransferId: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      totalAmount: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
        comment: 'Total order amount in cents',
      },
      platformFee: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
        comment: 'Platform fee amount in cents',
      },
      stripeFee: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
        comment: 'Stripe processing fee in cents',
      },
      taxes: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0,
        comment: 'Tax amount in cents',
      },
      sellerEarnings: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
        comment: 'Amount to be paid to seller in cents',
      },
      status: {
        type: Sequelize.ENUM('pending', 'processing', 'completed', 'failed'),
        allowNull: false,
        defaultValue: 'pending',
      },
      transferDate: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      failureReason: {
        type: Sequelize.TEXT,
        allowNull: true,
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

    // Add indexes for better performance
    await queryInterface.addIndex('Payouts', ['sellerId']);
    await queryInterface.addIndex('Payouts', ['orderId']);
    await queryInterface.addIndex('Payouts', ['status']);
    await queryInterface.addIndex('Payouts', ['transferDate']);
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.dropTable('Payouts');
  }
};
