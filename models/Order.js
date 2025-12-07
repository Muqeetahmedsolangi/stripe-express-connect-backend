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