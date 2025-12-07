module.exports = (sequelize, DataTypes) => {
  const OrderItem = sequelize.define('OrderItem', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    orderId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'Orders',
        key: 'id',
      },
    },
    productId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'Products',
        key: 'id',
      },
    },
    sellerId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'Users',
        key: 'id',
      },
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    price: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    quantity: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        min: 1,
      },
    },
  }, {
    timestamps: true,
    indexes: [
      {
        fields: ['orderId'],
      },
      {
        fields: ['productId'],
      },
      {
        fields: ['sellerId'],
      },
    ],
  });

  // Associations
  OrderItem.associate = function(models) {
    OrderItem.belongsTo(models.Order, {
      foreignKey: 'orderId',
      as: 'order',
    });
    OrderItem.belongsTo(models.Product, {
      foreignKey: 'productId',
      as: 'product',
    });
    OrderItem.belongsTo(models.User, {
      foreignKey: 'sellerId',
      as: 'seller',
    });
  };

  return OrderItem;
};