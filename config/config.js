require("dotenv").config();

const config = {
  local: {
    username: process.env.DB_USERNAME || "root",
    password: process.env.DB_PASSWORD || null,
    database: process.env.DB_DATABASE || "vipme-stripe-connect",
    host: process.env.DB_HOST || "127.0.0.1",
    dialect: process.env.DB_CONNECTION || "mysql",
    ssl: process.env.DB_SSL || false,
    port: process.env.DB_PORT || 3306,
  },
  development: {
    username: process.env.DB_USERNAME || "root",
    password: process.env.DB_PASSWORD || null,
    database: process.env.DB_DATABASE || "vipme-stripe-connect",
    host: process.env.DB_HOST || "127.0.0.1",
    dialect: process.env.DB_CONNECTION || "mysql",
    port: process.env.DB_PORT || 3306,
  },
  staging: {
    username: process.env.DB_USERNAME || "root",
    password: process.env.DB_PASSWORD || null,
    database: process.env.DB_DATABASE || "vipme-stripe-connect_staging",
    host: process.env.DB_HOST || "127.0.0.1",
    dialect: process.env.DB_CONNECTION || "mysql",
    ssl: process.env.DB_SSL || false,
    port: process.env.DB_PORT || 3306,
  },
  production: {
    username: process.env.DB_USERNAME || "root",
    password: process.env.DB_PASSWORD || null,
    database: process.env.DB_DATABASE || "vipme-stripe-connect_prod",
    host: process.env.DB_HOST || "127.0.0.1",
    dialect: process.env.DB_CONNECTION || "mysql",
    ssl: process.env.DB_SSL || false,
    port: process.env.DB_PORT || 3306,
  },
};

module.exports = config;