import { Sequelize } from "sequelize";
import dotenv from "dotenv";
dotenv.config();

// Ambil environment saat ini (development, production, dll)
const env = process.env.NODE_ENV || 'development';

const config = {
  username: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT) || 3306, 
  dialect: process.env.DB_DIALECT || "mysql",
  
  pool: {
    max: Number(process.env.DB_POOL_MAX) || 5,
    min: Number(process.env.DB_POOL_MIN) || 0,
    acquire: Number(process.env.DB_POOL_ACQUIRE) || 30000,
    idle: Number(process.env.DB_POOL_IDLE) || 10000,
  },

  logging: process.env.DB_LOGGING === "true" ? console.log : false
};

// Sesuaikan nama database berdasarkan environment
if (env === 'development') {
  config.database = process.env.DB_NAME_DEV || config.database + "_dev";
} else if (env === 'test') {
  config.database = process.env.DB_NAME_TEST || config.database + "_test";
}

// Buat dan ekspor instance Sequelize
export const sequelize = new Sequelize(
  config.database,
  config.username,
  config.password,
  {
    host: config.host,
    port: config.port,
    dialect: config.dialect,
    logging: config.logging,
    pool: config.pool,
  }
);