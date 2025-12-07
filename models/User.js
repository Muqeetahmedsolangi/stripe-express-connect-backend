const bcrypt = require('bcryptjs');

module.exports = (sequelize, DataTypes) => {
  const User = sequelize.define('User', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true,
      },
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        len: [6, 255],
      },
    },
    firstName: {
      type: DataTypes.STRING(50),
      allowNull: false,
    },
    lastName: {
      type: DataTypes.STRING(50),
      allowNull: false,
    },
    phoneNumber: {
      type: DataTypes.STRING,
      allowNull: true,
      validate: {
        is: /^\+?[\d\s-()]+$/,
      },
    },
    stripeCustomerId: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    stripeAccountId: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    onboardingCompleted: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    chargesEnabled: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    payoutsEnabled: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    role: {
      type: DataTypes.ENUM('user', 'seller', 'admin'),
      defaultValue: 'user',
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
    emailVerified: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    lastLogin: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  }, {
    timestamps: true,
    indexes: [
      {
        fields: ['email'],
      },
      {
        fields: ['stripeCustomerId'],
      },
      {
        fields: ['stripeAccountId'],
      },
    ],
    hooks: {
      beforeCreate: async (user) => {
        if (user.password) {
          user.password = await bcrypt.hash(user.password, 12);
        }
      },
      beforeUpdate: async (user) => {
        if (user.changed('password')) {
          user.password = await bcrypt.hash(user.password, 12);
        }
      },
    },
  });

  // Instance methods
  User.prototype.comparePassword = async function(candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password);
  };

  User.prototype.toJSON = function() {
    const values = Object.assign({}, this.get());
    delete values.password;
    return values;
  };

  // Virtual for full name
  User.prototype.getFullName = function() {
    return `${this.firstName} ${this.lastName}`;
  };

  // Associations
  User.associate = function(models) {
    User.hasMany(models.Product, {
      foreignKey: 'sellerId',
      as: 'products',
    });
    User.hasMany(models.Order, {
      foreignKey: 'userId',
      as: 'orders',
    });
    User.hasMany(models.Payout, {
      foreignKey: 'sellerId',
      as: 'payouts',
    });
  };

  return User;
};