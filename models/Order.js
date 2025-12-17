module.exports = (sequelize, DataTypes) => {
  const Order = sequelize.define('Order', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    orderNumber: {
      type: DataTypes.STRING,
      unique: true,
      allowNull: false,
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'Users',
        key: 'id',
      },
    },
    subtotal: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    governmentTax: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    platformFee: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    total: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    governmentTaxRate: {
      type: DataTypes.DECIMAL(5, 4),
      defaultValue: 0.0725,
    },
    platformFeeRate: {
      type: DataTypes.DECIMAL(5, 4),
      defaultValue: 0.0325,
    },
    stripePaymentIntentId: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    paymentStatus: {
      type: DataTypes.ENUM('pending', 'succeeded', 'failed', 'canceled'),
      defaultValue: 'pending',
    },
    paymentMethod: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    currency: {
      type: DataTypes.STRING(3),
      defaultValue: 'USD',
    },
    paidAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    status: {
      type: DataTypes.ENUM('pending', 'confirmed', 'canceled'),
      defaultValue: 'pending',
    },
    paymentHoldDays: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: 5,
      comment: 'Number of days to hold payment before release',
    },
    paymentReleaseDate: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: 'Date when payment should be released to sellers',
    },
    paymentHeld: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
      comment: 'Whether payment is currently held in platform account',
    },
    paymentReleased: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      comment: 'Whether payment has been released to sellers',
    },
    paymentReleasedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: 'Timestamp when payment was released',
    },
  }, {
    timestamps: true,
    indexes: [
      {
        fields: ['userId'],
      },
      {
        fields: ['orderNumber'],
      },
      {
        fields: ['stripePaymentIntentId'],
      },
      {
        fields: ['status'],
      },
      {
        fields: ['createdAt'],
      },
      {
        fields: ['paymentReleaseDate'],
      },
      {
        fields: ['paymentHeld'],
      },
      {
        fields: ['paymentReleased'],
      },
    ],
    hooks: {
      beforeCreate: async (order) => {
        if (!order.orderNumber) {
          const timestamp = Date.now().toString();
          const random = Math.random().toString(36).substring(2, 8).toUpperCase();
          order.orderNumber = `ORD-${timestamp.slice(-8)}-${random}`;
        }
      },
    },
  });

  // Instance methods
  Order.prototype.getTotalItems = async function() {
    const orderItems = await this.getOrderItems();
    return orderItems.reduce((total, item) => total + item.quantity, 0);
  };

  // Associations
  Order.associate = function(models) {
    Order.belongsTo(models.User, {
      foreignKey: 'userId',
      as: 'user',
    });
    Order.hasMany(models.OrderItem, {
      foreignKey: 'orderId',
      as: 'orderItems',
    });
    Order.hasMany(models.Payout, {
      foreignKey: 'orderId',
      as: 'payouts',
    });
  };

  return Order;
};