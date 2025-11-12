import * as dotenv from "dotenv";

dotenv.config();

export const env = {
  NODE_ENV: process.env.NODE_ENV || "development",
  PORT: process.env.PORT || 4000,
  JWT_SECRET: process.env.JWT_SECRET || "super-secret-dev-key",
  DB_HOST: process.env.DB_HOST || "localhost",
  DB_PORT: Number(process.env.DB_PORT || 5432),
  DB_USER: process.env.DB_USER || "postgres",
  DB_PASS: process.env.DB_PASS || "123456",
  DB_NAME: process.env.DB_NAME || "room_booking"
};
