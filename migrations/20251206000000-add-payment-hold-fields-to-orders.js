'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.addColumn('Orders', 'paymentHoldDays', {
      type: Sequelize.INTEGER,
      allowNull: true,
      defaultValue: 5,
      comment: 'Number of days to hold payment before release'
    });

    await queryInterface.addColumn('Orders', 'paymentReleaseDate', {
      type: Sequelize.DATE,
      allowNull: true,
      comment: 'Date when payment should be released to sellers'
    });

    await queryInterface.addColumn('Orders', 'paymentHeld', {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: true,
      comment: 'Whether payment is currently held in platform account'
    });

    await queryInterface.addColumn('Orders', 'paymentReleased', {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      comment: 'Whether payment has been released to sellers'
    });

    await queryInterface.addColumn('Orders', 'paymentReleasedAt', {
      type: Sequelize.DATE,
      allowNull: true,
      comment: 'Timestamp when payment was released'
    });

    await queryInterface.addIndex('Orders', ['paymentReleaseDate']);
    await queryInterface.addIndex('Orders', ['paymentHeld']);
    await queryInterface.addIndex('Orders', ['paymentReleased']);
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.removeIndex('Orders', ['paymentReleased']);
    await queryInterface.removeIndex('Orders', ['paymentHeld']);
    await queryInterface.removeIndex('Orders', ['paymentReleaseDate']);
    
    await queryInterface.removeColumn('Orders', 'paymentReleasedAt');
    await queryInterface.removeColumn('Orders', 'paymentReleased');
    await queryInterface.removeColumn('Orders', 'paymentHeld');
    await queryInterface.removeColumn('Orders', 'paymentReleaseDate');
    await queryInterface.removeColumn('Orders', 'paymentHoldDays');
  }
};

