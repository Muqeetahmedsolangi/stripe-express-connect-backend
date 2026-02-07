'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.addColumn('Users', 'payoutScheduleType', {
      type: Sequelize.ENUM('daily', 'weekly', 'monthly', 'custom'),
      allowNull: true,
      defaultValue: null,
      comment: 'Type of payout schedule: daily, weekly, monthly, or custom date'
    });

    await queryInterface.addColumn('Users', 'payoutDay', {
      type: Sequelize.INTEGER,
      allowNull: true,
      defaultValue: null,
      comment: 'Day of month (1-31) for monthly payouts, or day of week (0-6) for weekly'
    });

    await queryInterface.addColumn('Users', 'payoutDate', {
      type: Sequelize.DATE,
      allowNull: true,
      defaultValue: null,
      comment: 'Specific date for custom payout schedule'
    });

    await queryInterface.addColumn('Users', 'nextPayoutDate', {
      type: Sequelize.DATE,
      allowNull: true,
      defaultValue: null,
      comment: 'Next scheduled payout date for this seller'
    });

    await queryInterface.addIndex('Users', ['payoutScheduleType']);
    await queryInterface.addIndex('Users', ['nextPayoutDate']);
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.removeIndex('Users', ['nextPayoutDate']);
    await queryInterface.removeIndex('Users', ['payoutScheduleType']);
    
    await queryInterface.removeColumn('Users', 'nextPayoutDate');
    await queryInterface.removeColumn('Users', 'payoutDate');
    await queryInterface.removeColumn('Users', 'payoutDay');
    await queryInterface.removeColumn('Users', 'payoutScheduleType');
  }
};

