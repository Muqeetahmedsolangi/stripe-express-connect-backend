module.exports = (sequelize, DataTypes) => {
  const Payout = sequelize.define('Payout', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    sellerId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'Users',
        key: 'id',
      },
    },
    orderId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'Orders',
        key: 'id',
      },
    },
    stripeTransferId: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    totalAmount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      comment: 'Total order amount in cents',
    },
    platformFee: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      comment: 'Platform fee amount in cents',
    },
    stripeFee: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      comment: 'Stripe processing fee in cents',
    },
    taxes: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0,
      comment: 'Tax amount in cents',
    },
    sellerEarnings: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      comment: 'Amount to be paid to seller in cents',
    },
    status: {
      type: DataTypes.ENUM('pending', 'processing', 'completed', 'failed'),
      allowNull: false,
      defaultValue: 'pending',
    },
    transferDate: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    failureReason: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  }, {
    tableName: 'Payouts',
    timestamps: true,
    indexes: [
      {
        fields: ['sellerId'],
      },
      {
        fields: ['orderId'],
      },
      {
        fields: ['status'],
      },
      {
        fields: ['transferDate'],
      },
    ],
  });

  // Associations
  Payout.associate = function(models) {
    Payout.belongsTo(models.User, {
      foreignKey: 'sellerId',
      as: 'seller',
    });
    Payout.belongsTo(models.Order, {
      foreignKey: 'orderId',
      as: 'order',
    });
  };

  return Payout;
};